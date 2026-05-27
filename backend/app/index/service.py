"""索引业务逻辑：构建、加载、删除、缓存。

构建是同步阻塞的（中期演示足够，结项再做异步任务队列）。
内存中维护一个 `_index_cache` 把已加载的索引留住，避免每次检索都从磁盘读。
"""
from __future__ import annotations

import logging
import threading
import time
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ann.base import BaseANNIndex
from app.ann.factory import SUPPORTED_ALGORITHMS, create_index
from app.core.config import settings
from app.datasets import service as ds_service
from app.index import constants as idx_const
from app.index.exceptions import IndexNotFound, IndexNotReady, UnsupportedAlgorithm
from app.index.models import Index
from app.index.schemas import IndexBuildRequest

logger = logging.getLogger(__name__)


# index_id -> 已加载的 BaseANNIndex 实例
_index_cache: dict[int, BaseANNIndex] = {}
_cache_lock = threading.Lock()


def _index_root() -> Path:
    root = Path(settings.INDEX_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _index_path(index_id: int, algorithm: str) -> Path:
    return _index_root() / f"index_{index_id}_{algorithm}.bin"


def list_all(db: Session, dataset_id: int | None = None) -> list[Index]:
    stmt = (
        select(Index)
        .where(Index.status != idx_const.STATUS_DELETED)
        .order_by(Index.id.desc())
    )
    if dataset_id is not None:
        stmt = stmt.where(Index.dataset_id == dataset_id)
    return list(db.scalars(stmt))


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


def evict_cache(index_id: int | None = None) -> None:
    """测试与运维用：清缓存。"""
    with _cache_lock:
        if index_id is None:
            _index_cache.clear()
        else:
            _index_cache.pop(index_id, None)


def _dir_or_file_size(path: Path) -> int:
    if path.is_file():
        return path.stat().st_size
    if path.is_dir():
        return sum(p.stat().st_size for p in path.rglob("*") if p.is_file())
    return 0
