"""数据集业务逻辑：注册、查询、删除。"""
from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import filters as obs_filters
from app.core.config import settings
from app.datasets import constants as ds_const
from app.datasets import preprocessing
from app.datasets.exceptions import (
    DatasetFileMissing,
    DatasetNameConflict,
    DatasetNotFound,
    DatasetNotReady,
    EmbeddingKeyMissing,
)
from app.datasets.models import Dataset
from app.datasets.schemas import DatasetRegisterRequest

logger = logging.getLogger(__name__)


# ---------- 数据集工件内存缓存 ----------
# 检索热路径会反复读 vectors/obs/cell_ids；这里按 dataset_id 缓存，省掉每次查询的磁盘 IO，
# 并预建 cell_id→row 字典把 find_cell_row 从 O(n) 降到 O(1)。
# 用 (vectors 文件路径, mtime) 校验失效：switch_embedding 覆盖工件、或测试间复用 id，都会自动重载。
# 注意：缓存数组按"只读共享"约定，调用方不得原地修改（需要改写的地方都先 copy）。
_artifact_lock = threading.Lock()
_artifact_cache: dict[int, "_Artifacts"] = {}


@dataclass
class _Artifacts:
    source_key: tuple
    vectors: np.ndarray
    cell_ids: np.ndarray
    obs: pd.DataFrame
    row_index: dict[str, int]
    value_counts_50: dict[str, dict[str, int]] | None = None


def _source_key(ds: "Dataset") -> tuple:
    try:
        mtime = Path(ds.vectors_path).stat().st_mtime
    except OSError:
        mtime = 0.0
    return (ds.vectors_path, mtime)


def _artifacts(ds: "Dataset") -> "_Artifacts":
    """取（或加载并缓存）某数据集的工件。未就绪则报错。"""
    if not (ds.vectors_path and ds.cell_ids_path and ds.obs_path):
        raise DatasetNotReady(ds.id, ds.status)
    key = _source_key(ds)
    with _artifact_lock:
        entry = _artifact_cache.get(ds.id)
        if entry is not None and entry.source_key == key:
            return entry
    # 锁外加载（IO 可能较重），完成后再写回缓存
    vectors = preprocessing.load_vectors(ds.vectors_path)
    cell_ids = preprocessing.load_cell_ids(ds.cell_ids_path)
    obs = preprocessing.load_obs(ds.obs_path)
    row_index: dict[str, int] = {}
    for i, cid in enumerate(cell_ids.tolist()):
        row_index.setdefault(str(cid), i)  # 保留首个出现位置，与旧 np.where 行为一致
    entry = _Artifacts(
        source_key=key, vectors=vectors, cell_ids=cell_ids, obs=obs, row_index=row_index,
    )
    with _artifact_lock:
        _artifact_cache[ds.id] = entry
    return entry


def _invalidate_artifacts(dataset_id: int) -> None:
    with _artifact_lock:
        _artifact_cache.pop(dataset_id, None)


def _upload_root() -> Path:
    root = Path(settings.UPLOAD_DIR)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _artifact_paths(dataset_id: int) -> tuple[Path, Path, Path]:
    base = _upload_root() / f"dataset_{dataset_id}"
    return (
        base.with_suffix(".vectors.npy"),
        base.with_suffix(".cell_ids.npy"),
        base.with_suffix(".obs.parquet"),
    )


def get_by_id(db: Session, dataset_id: int) -> Dataset:
    obj = db.get(Dataset, dataset_id)
    if obj is None:
        raise DatasetNotFound(dataset_id)
    return obj


def get_ready(db: Session, dataset_id: int) -> Dataset:
    """检索/索引等下游依赖：要求数据集处于 ready。"""
    obj = get_by_id(db, dataset_id)
    if obj.status != ds_const.STATUS_READY:
        raise DatasetNotReady(dataset_id, obj.status)
    return obj


def list_all(db: Session) -> list[Dataset]:
    return list(db.scalars(
        select(Dataset)
        .where(Dataset.status != ds_const.STATUS_DELETED)
        .order_by(Dataset.id.desc())
    ))


def register(db: Session, req: DatasetRegisterRequest) -> Dataset:
    """注册一个已经存在于磁盘上的 .h5ad（不复制文件）。

    会同步完成抽取与持久化，成功后 status=ready。失败 status=error。
    """
    if db.scalar(select(Dataset).where(Dataset.name == req.name)) is not None:
        raise DatasetNameConflict(req.name)

    src = Path(req.source_path)
    if not src.exists():
        raise DatasetFileMissing(str(src))

    ds = Dataset(
        name=req.name,
        description=req.description,
        source_path=str(src.resolve()),
        embedding_key=req.embedding_key,
        status=ds_const.STATUS_PROCESSING,
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    logger.info("dataset %s registered, start extracting", ds.id)

    try:
        extracted = preprocessing.load_h5ad(src, embedding_key=req.embedding_key)
    except KeyError as e:
        # obsm 中没有指定的 embedding key
        ds.status = ds_const.STATUS_ERROR
        ds.error_msg = str(e)
        db.commit()
        # 把可用 key 解析出来，给前端更友好的报错
        import anndata as ad
        adata = ad.read_h5ad(src, backed="r")
        try:
            available = list(adata.obsm.keys())
        finally:
            if adata.isbacked:
                adata.file.close()
        raise EmbeddingKeyMissing(req.embedding_key, available)
    except (FileNotFoundError, ValueError, OSError) as e:
        ds.status = ds_const.STATUS_ERROR
        ds.error_msg = str(e)
        db.commit()
        raise

    vectors_p, cell_ids_p, obs_p = _artifact_paths(ds.id)
    preprocessing.persist_artifacts(extracted, vectors_p, cell_ids_p, obs_p)

    ds.vectors_path = str(vectors_p)
    ds.cell_ids_path = str(cell_ids_p)
    ds.obs_path = str(obs_p)
    ds.n_cells = extracted.n_cells
    ds.n_genes = extracted.n_genes
    ds.vector_dim = extracted.vector_dim
    ds.status = ds_const.STATUS_READY
    db.commit()
    db.refresh(ds)
    logger.info(
        "dataset %s ready: n_cells=%d vector_dim=%d",
        ds.id, ds.n_cells, ds.vector_dim,
    )
    _invalidate_artifacts(ds.id)  # 防止复用 id 时读到上个数据集的残留缓存
    return ds


def switch_embedding(db: Session, dataset_id: int, new_key: str) -> Dataset:
    """切换数据集的检索向量（obsm key），级联清理旧索引并覆盖工件文件。"""
    from sqlalchemy import select as sa_select
    from app.index.models import Index as IndexModel
    from app.index import service as idx_service

    ds = get_ready(db, dataset_id)

    src = Path(ds.source_path)
    if not src.exists():
        raise DatasetFileMissing(str(src))

    from app.index import constants as idx_const_inner
    for idx in db.scalars(
        sa_select(IndexModel)
        .where(IndexModel.dataset_id == dataset_id)
        .where(IndexModel.status != idx_const_inner.STATUS_DELETED)
    ):
        idx_service.delete(db, idx.id)

    ds.status = ds_const.STATUS_PROCESSING
    ds.error_msg = ""
    db.commit()

    try:
        extracted = preprocessing.load_h5ad(src, embedding_key=new_key)
    except KeyError as e:
        ds.status = ds_const.STATUS_ERROR
        ds.error_msg = str(e)
        db.commit()
        import anndata as ad
        adata = ad.read_h5ad(src, backed="r")
        try:
            available = list(adata.obsm.keys())
        finally:
            if adata.isbacked:
                adata.file.close()
        raise EmbeddingKeyMissing(new_key, available) from e
    except Exception as e:
        ds.status = ds_const.STATUS_ERROR
        ds.error_msg = str(e)
        db.commit()
        raise

    vectors_p, cell_ids_p, obs_p = _artifact_paths(ds.id)
    try:
        preprocessing.persist_artifacts(extracted, vectors_p, cell_ids_p, obs_p)
    except Exception as e:
        ds.status = ds_const.STATUS_ERROR
        ds.error_msg = str(e)
        db.commit()
        raise

    ds.embedding_key = new_key
    ds.vector_dim = extracted.vector_dim
    ds.n_cells = extracted.n_cells
    ds.status = ds_const.STATUS_READY
    db.commit()
    db.refresh(ds)
    _invalidate_artifacts(dataset_id)  # 工件已被覆盖，丢弃旧缓存
    logger.info("dataset %s embedding switched to %s (dim=%d)", dataset_id, new_key, ds.vector_dim)
    return ds


def delete(db: Session, dataset_id: int) -> None:
    ds = get_by_id(db, dataset_id)

    # 先清理关联索引（文件 + 缓存 + DB 记录）
    from sqlalchemy import select
    from app.index.models import Index as IndexModel
    from app.index import service as idx_service
    from app.index import constants as idx_const_inner
    for idx in db.scalars(
        select(IndexModel)
        .where(IndexModel.dataset_id == dataset_id)
        .where(IndexModel.status != idx_const_inner.STATUS_DELETED)
    ):
        idx_service.delete(db, idx.id)

    # 删三个工件文件
    for p in (ds.vectors_path, ds.cell_ids_path, ds.obs_path):
        if p and Path(p).exists():
            Path(p).unlink(missing_ok=True)

    ds.status = ds_const.STATUS_DELETED
    db.commit()
    _invalidate_artifacts(dataset_id)


# -------- 数据访问：供 search / index / benchmark / visualize 使用 --------

def load_vectors(ds: Dataset) -> np.ndarray:
    """返回缓存的向量矩阵（只读共享，调用方需要改写时务必先 copy）。"""
    return _artifacts(ds).vectors


def load_cell_ids(ds: Dataset) -> np.ndarray:
    return _artifacts(ds).cell_ids


def load_obs(ds: Dataset) -> pd.DataFrame:
    return _artifacts(ds).obs


def find_cell_row(ds: Dataset, cell_id: str) -> int:
    """根据 cell_id（字符串）找出向量矩阵里的行号（O(1) 走预建字典）。"""
    row = _artifacts(ds).row_index.get(str(cell_id))
    if row is None:
        raise ValueError(f"数据集 {ds.id} 中找不到 cell_id='{cell_id}'")
    return row


def filter_cells(
    ds: Dataset,
    filters,
    offset: int = 0,
    limit: int = 50,
    *,
    cache_for: int | None = None,
) -> tuple[list[dict], int]:
    """按 obs 条件过滤细胞，返回 (items, total_matched)。不走 ANN。"""
    obs = load_obs(ds)
    cell_ids = load_cell_ids(ds)

    plan = obs_filters.build_filter_plan(obs, filters)
    total = plan.n_matching

    items = []
    for row_index in plan.page(offset, limit):
        cell_row = obs.iloc[int(row_index)]
        obs_row = {col: _to_jsonable_val(cell_row[col]) for col in obs.columns}
        items.append({
            "cell_id": str(cell_ids[int(row_index)]),
            "row_index": int(row_index),
            "obs": obs_row,
        })
    if cache_for is not None:
        from app.export.cache import filter_cache
        filter_cache[cache_for] = (ds.id, filters)
    return items, total


def _to_jsonable_val(v):
    import math
    if isinstance(v, float) and math.isnan(v):
        return None
    if hasattr(v, "item"):
        return v.item()
    return v if isinstance(v, (str, int, float, bool, type(None))) else str(v)


def value_counts(ds: Dataset, max_unique_per_col: int = 50) -> dict[str, dict[str, int]]:
    """统计 obs 各列的取值分布（用于前端筛选器）。

    跳过取值过多的列（例如 cell_id-like），避免响应体爆炸。
    默认阈值 50 的结果会缓存（_auto_oversample 每次过滤检索都要用）。
    """
    entry = _artifacts(ds)
    if max_unique_per_col == 50:
        if entry.value_counts_50 is None:
            entry.value_counts_50 = _compute_value_counts(entry.obs, 50)
        return entry.value_counts_50
    return _compute_value_counts(entry.obs, max_unique_per_col)


def _compute_value_counts(obs: pd.DataFrame, max_unique_per_col: int) -> dict[str, dict[str, int]]:
    out: dict[str, dict[str, int]] = {}
    for col in obs.columns:
        vc = obs[col].astype(str).value_counts()
        if len(vc) > max_unique_per_col:
            continue
        out[col] = {str(k): int(v) for k, v in vc.items()}
    return out


def numeric_summary(ds: Dataset) -> dict[str, dict[str, float | int | None]]:
    """Return compact numeric summaries for dashboard metrics."""
    obs = load_obs(ds)
    out: dict[str, dict[str, float | int | None]] = {}
    for col in obs.columns:
        series = pd.to_numeric(obs[col], errors="coerce").dropna()
        if series.empty:
            continue
        out[col] = {
            "count": int(series.count()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "min": float(series.min()),
            "max": float(series.max()),
        }
    return out
