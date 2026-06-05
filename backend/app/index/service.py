"""索引业务逻辑：构建、加载、删除、缓存。

构建是同步阻塞的（中期演示足够，结项再做异步任务队列）。
内存中维护一个 `_index_cache` 把已加载的索引留住，避免每次检索都从磁盘读。
"""
from __future__ import annotations

import logging
import threading
import time
from pathlib import Path

import numpy as np
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ann.base import BaseANNIndex
from app.ann.factory import SUPPORTED_ALGORITHMS, create_index
from app.core.config import settings
from app.datasets import service as ds_service
from app.index import constants as idx_const
from app.index.exceptions import IndexNotFound, IndexNotReady, UnsupportedAlgorithm
from app.index.models import CombinedIndex, Index
from app.index.schemas import CombinedIndexBuildRequest, IndexBuildRequest

logger = logging.getLogger(__name__)


# index_id -> 已加载的 BaseANNIndex 实例
_index_cache: dict[int, BaseANNIndex] = {}
_combined_index_cache: dict[int, BaseANNIndex] = {}
_cache_lock = threading.Lock()


def _index_root() -> Path:
    root = Path(settings.INDEX_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _index_path(index_id: int, algorithm: str) -> Path:
    return _index_root() / f"index_{index_id}_{algorithm}.bin"


def _combined_index_path(index_id: int, algorithm: str) -> Path:
    return _index_root() / f"combined_{index_id}_{algorithm}.bin"


def _combined_mapping_path(index_id: int) -> Path:
    return _index_root() / f"combined_{index_id}.mapping.npz"


def list_all(db: Session, dataset_id: int | None = None) -> list[Index]:
    stmt = (
        select(Index)
        .where(Index.status != idx_const.STATUS_DELETED)
        .order_by(Index.id.desc())
    )
    if dataset_id is not None:
        stmt = stmt.where(Index.dataset_id == dataset_id)
    return list(db.scalars(stmt))


def list_combined(db: Session, dataset_id: int | None = None) -> list[CombinedIndex]:
    stmt = (
        select(CombinedIndex)
        .where(CombinedIndex.status != idx_const.STATUS_DELETED)
        .order_by(CombinedIndex.id.desc())
    )
    rows = list(db.scalars(stmt))
    if dataset_id is None:
        return rows
    return [row for row in rows if dataset_id in (row.dataset_ids or [])]


def get_by_id(db: Session, index_id: int) -> Index:
    obj = db.get(Index, index_id)
    if obj is None:
        raise IndexNotFound(index_id)
    return obj


def get_ready(db: Session, index_id: int) -> Index:
    obj = get_by_id(db, index_id)
    if obj.status != idx_const.STATUS_READY:
        raise IndexNotReady(index_id, obj.status)
    return obj


def get_combined_by_id(db: Session, combined_index_id: int) -> CombinedIndex:
    obj = db.get(CombinedIndex, combined_index_id)
    if obj is None:
        raise IndexNotFound(combined_index_id)
    return obj


def get_combined_ready(db: Session, combined_index_id: int) -> CombinedIndex:
    obj = get_combined_by_id(db, combined_index_id)
    if obj.status != idx_const.STATUS_READY:
        raise IndexNotReady(combined_index_id, obj.status)
    return obj


def build(db: Session, req: IndexBuildRequest) -> Index:
    if req.algorithm not in SUPPORTED_ALGORITHMS:
        raise UnsupportedAlgorithm(req.algorithm, SUPPORTED_ALGORITHMS)

    ds = ds_service.get_ready(db, req.dataset_id)
    vectors = ds_service.load_vectors(ds)

    obj = Index(
        dataset_id=ds.id,
        algorithm=req.algorithm,
        params=req.params,
        status=idx_const.STATUS_BUILDING,
        n_vectors=int(vectors.shape[0]),
        vector_dim=int(vectors.shape[1]),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    logger.info("index %s building: algo=%s n=%d d=%d",
                obj.id, obj.algorithm, obj.n_vectors, obj.vector_dim)

    try:
        index = create_index(obj.algorithm, dim=obj.vector_dim, **obj.params)
        # 用向量矩阵的行号作为内部 id（与 cell_ids.npy 对齐）
        t0 = time.perf_counter()
        index.build(vectors, ids=None)
        t1 = time.perf_counter()

        file_path = _index_path(obj.id, obj.algorithm)
        index.save(str(file_path))

        obj.file_path = str(file_path)
        obj.build_time_ms = (t1 - t0) * 1000.0
        obj.index_size_bytes = _dir_or_file_size(file_path)
        obj.status = idx_const.STATUS_READY
        db.commit()
        db.refresh(obj)

        with _cache_lock:
            _index_cache[obj.id] = index
        logger.info("index %s ready: build=%.2fms size=%dB",
                    obj.id, obj.build_time_ms, obj.index_size_bytes)
        return obj
    except Exception as e:
        obj.status = idx_const.STATUS_ERROR
        obj.error_msg = str(e)
        db.commit()
        logger.exception("index %s build failed", obj.id)
        raise


def build_combined(db: Session, req: CombinedIndexBuildRequest) -> CombinedIndex:
    """Build one physical ANN index from multiple ready datasets."""
    if req.algorithm not in SUPPORTED_ALGORITHMS:
        raise UnsupportedAlgorithm(req.algorithm, SUPPORTED_ALGORITHMS)

    dataset_ids = _dedupe_ids(req.dataset_ids)
    datasets = [ds_service.get_ready(db, dataset_id) for dataset_id in dataset_ids]
    dims = {ds.vector_dim for ds in datasets}
    if len(dims) != 1:
        dim_desc = {ds.id: ds.vector_dim for ds in datasets}
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"联合索引要求所有数据集向量维度一致，当前维度：{dim_desc}",
        )

    vector_blocks: list[np.ndarray] = []
    mapping_dataset_ids: list[int] = []
    mapping_row_indices: list[int] = []
    mapping_cell_ids: list[str] = []

    for ds in datasets:
        vectors = ds_service.load_vectors(ds)
        cell_ids = ds_service.load_cell_ids(ds)
        vector_blocks.append(vectors)
        mapping_dataset_ids.extend([ds.id] * int(vectors.shape[0]))
        mapping_row_indices.extend(range(int(vectors.shape[0])))
        mapping_cell_ids.extend(str(cell_id) for cell_id in cell_ids)

    combined_vectors = np.ascontiguousarray(np.vstack(vector_blocks).astype(np.float32))
    name = req.name.strip() or f"combined_{'_'.join(str(x) for x in dataset_ids)}"

    obj = CombinedIndex(
        name=name,
        description=req.description,
        dataset_ids=dataset_ids,
        algorithm=req.algorithm,
        params=req.params,
        status=idx_const.STATUS_BUILDING,
        n_vectors=int(combined_vectors.shape[0]),
        vector_dim=int(combined_vectors.shape[1]),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    logger.info(
        "combined index %s building: datasets=%s algo=%s n=%d d=%d",
        obj.id, obj.dataset_ids, obj.algorithm, obj.n_vectors, obj.vector_dim,
    )

    try:
        index = create_index(obj.algorithm, dim=obj.vector_dim, **obj.params)
        t0 = time.perf_counter()
        index.build(combined_vectors, ids=None)
        t1 = time.perf_counter()

        file_path = _combined_index_path(obj.id, obj.algorithm)
        mapping_path = _combined_mapping_path(obj.id)
        index.save(str(file_path))
        np.savez_compressed(
            mapping_path,
            dataset_ids=np.asarray(mapping_dataset_ids, dtype=np.int64),
            row_indices=np.asarray(mapping_row_indices, dtype=np.int64),
            cell_ids=np.asarray(mapping_cell_ids, dtype=str),
        )

        obj.file_path = str(file_path)
        obj.mapping_path = str(mapping_path)
        obj.build_time_ms = (t1 - t0) * 1000.0
        obj.index_size_bytes = _dir_or_file_size(file_path) + _dir_or_file_size(mapping_path)
        obj.status = idx_const.STATUS_READY
        db.commit()
        db.refresh(obj)

        with _cache_lock:
            _combined_index_cache[obj.id] = index
        logger.info(
            "combined index %s ready: build=%.2fms size=%dB",
            obj.id, obj.build_time_ms, obj.index_size_bytes,
        )
        return obj
    except Exception as e:
        obj.status = idx_const.STATUS_ERROR
        obj.error_msg = str(e)
        db.commit()
        logger.exception("combined index %s build failed", obj.id)
        raise


def delete(db: Session, index_id: int) -> None:
    obj = get_by_id(db, index_id)
    if obj.file_path:
        p = Path(obj.file_path)
        if p.exists():
            p.unlink(missing_ok=True)
        # FAISS Flat 还有一个 .ids.npy 伴生文件
        sidecar = p.with_suffix(p.suffix + ".ids.npy")
        if sidecar.exists():
            sidecar.unlink(missing_ok=True)
    with _cache_lock:
        _index_cache.pop(index_id, None)
    obj.status = idx_const.STATUS_DELETED
    db.commit()


def delete_combined(db: Session, combined_index_id: int) -> None:
    obj = get_combined_by_id(db, combined_index_id)
    for raw_path in (obj.file_path, obj.mapping_path):
        if not raw_path:
            continue
        p = Path(raw_path)
        if p.exists():
            p.unlink(missing_ok=True)
        sidecar = p.with_suffix(p.suffix + ".ids.npy")
        if sidecar.exists():
            sidecar.unlink(missing_ok=True)
    with _cache_lock:
        _combined_index_cache.pop(combined_index_id, None)
    obj.status = idx_const.STATUS_DELETED
    db.commit()


def load_index_instance(obj: Index) -> BaseANNIndex:
    """加载（或从缓存取）一个就绪的索引实例。"""
    if obj.status != idx_const.STATUS_READY:
        raise IndexNotReady(obj.id, obj.status)

    with _cache_lock:
        cached = _index_cache.get(obj.id)
        if cached is not None:
            return cached

    instance = create_index(obj.algorithm, dim=obj.vector_dim, **(obj.params or {}))
    instance.load(obj.file_path)

    with _cache_lock:
        _index_cache[obj.id] = instance
    return instance


def load_combined_index_instance(obj: CombinedIndex) -> BaseANNIndex:
    """Load or reuse one ready combined index instance."""
    if obj.status != idx_const.STATUS_READY:
        raise IndexNotReady(obj.id, obj.status)

    with _cache_lock:
        cached = _combined_index_cache.get(obj.id)
        if cached is not None:
            return cached

    instance = create_index(obj.algorithm, dim=obj.vector_dim, **(obj.params or {}))
    instance.load(obj.file_path)

    with _cache_lock:
        _combined_index_cache[obj.id] = instance
    return instance


def load_combined_mapping(obj: CombinedIndex) -> dict[str, np.ndarray]:
    data = np.load(obj.mapping_path, allow_pickle=False)
    return {
        "dataset_ids": data["dataset_ids"].astype(np.int64),
        "row_indices": data["row_indices"].astype(np.int64),
        "cell_ids": data["cell_ids"].astype(str),
    }


def evict_cache(index_id: int | None = None) -> None:
    """测试与运维用：清缓存。"""
    with _cache_lock:
        if index_id is None:
            _index_cache.clear()
            _combined_index_cache.clear()
        else:
            _index_cache.pop(index_id, None)
            _combined_index_cache.pop(index_id, None)


def _dir_or_file_size(path: Path) -> int:
    if path.is_file():
        return path.stat().st_size
    if path.is_dir():
        return sum(p.stat().st_size for p in path.rglob("*") if p.is_file())
    return 0


def _dedupe_ids(ids: list[int]) -> list[int]:
    seen: set[int] = set()
    out: list[int] = []
    for item in ids:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    if len(out) < 2:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="联合索引至少需要两个不同的数据集",
        )
    return out
