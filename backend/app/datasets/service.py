"""数据集业务逻辑：注册、查询、删除。"""
from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

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
    return list(db.scalars(select(Dataset).order_by(Dataset.id.desc())))


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
    return ds


def delete(db: Session, dataset_id: int) -> None:
    ds = get_by_id(db, dataset_id)
    # 删工件
    for p in (ds.vectors_path, ds.cell_ids_path, ds.obs_path):
        if p and Path(p).exists():
            Path(p).unlink(missing_ok=True)
    # 注：关联索引的级联删除由 index.service 负责，此处只把数据集标记为 deleted 留痕。
    ds.status = ds_const.STATUS_DELETED
    db.commit()


# -------- 数据访问：供 search / index / benchmark / visualize 使用 --------

def load_vectors(ds: Dataset) -> np.ndarray:
    if not ds.vectors_path:
        raise DatasetNotReady(ds.id, ds.status)
    return preprocessing.load_vectors(ds.vectors_path)


def load_cell_ids(ds: Dataset) -> np.ndarray:
    if not ds.cell_ids_path:
        raise DatasetNotReady(ds.id, ds.status)
    return preprocessing.load_cell_ids(ds.cell_ids_path)


def load_obs(ds: Dataset) -> pd.DataFrame:
    if not ds.obs_path:
        raise DatasetNotReady(ds.id, ds.status)
    return preprocessing.load_obs(ds.obs_path)


def find_cell_row(ds: Dataset, cell_id: str) -> int:
    """根据 cell_id（字符串）找出向量矩阵里的行号。"""
    ids = load_cell_ids(ds)
    matches = np.where(ids == cell_id)[0]
    if matches.size == 0:
        raise ValueError(f"数据集 {ds.id} 中找不到 cell_id='{cell_id}'")
    return int(matches[0])


def value_counts(ds: Dataset, max_unique_per_col: int = 50) -> dict[str, dict[str, int]]:
    """统计 obs 各列的取值分布（用于前端筛选器）。

    跳过取值过多的列（例如 cell_id-like），避免响应体爆炸。
    """
    obs = load_obs(ds)
    out: dict[str, dict[str, int]] = {}
    for col in obs.columns:
        vc = obs[col].astype(str).value_counts()
        if len(vc) > max_unique_per_col:
            continue
        out[col] = {str(k): int(v) for k, v in vc.items()}
    return out
