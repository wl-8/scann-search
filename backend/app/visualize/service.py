"""可视化业务逻辑。

visualize 模块始终基于数据集当前激活的 embedding（vectors.npy）：
- 2D 模式：取 vectors 第 0、1 列（PC1/PC2 或 UMAP dim1/dim2）
- 3D 模式：取 vectors 第 0、1、2 列（要求 vector_dim >= 3）

降采样采用分层采样（按 color_by 字段各 label 等比抽取），确保稀有细胞类型不被丢弃。
"""
from __future__ import annotations

import math
from pathlib import Path

import anndata as ad
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.datasets import service as ds_service
from app.datasets.models import Dataset
from app.visualize.exceptions import ColorByColumnNotFound, UnsupportedMode, VisualizationEmbeddingNotFound
from app.visualize.schemas import (
    EmbeddingPoint,
    EmbeddingResponse,
    LocatePoint,
    LocateResponse,
    ModesResponse,
)

_DEFAULT_COLOR_BY = "cell_type"
_MAX_POINTS_DEFAULT = 50_000


def _available_modes(vector_dim: int) -> list[str]:
    return ["2d", "3d"] if vector_dim >= 3 else ["2d"]


def _color_options(obs: pd.DataFrame) -> list[str]:
    """返回适合着色的 obs 列：排除高基数数值列，保留分类/字符串列及低基数列。"""
    options: list[str] = []
    for col in obs.columns:
        n_unique = obs[col].nunique()
        if n_unique <= 200:          # 取值太多（如 cell_id-like）不适合着色
            options.append(col)
    return options


def _stratified_sample(
    indices: np.ndarray,
    labels: np.ndarray,
    max_points: int,
) -> np.ndarray:
    """分层采样：按 label 各组等比抽取，确保稀有组不被完全丢弃。"""
    if len(indices) <= max_points:
        return indices

    unique_labels, counts = np.unique(labels, return_counts=True)
    sampled: list[np.ndarray] = []
    for lbl, cnt in zip(unique_labels, counts):
        mask = labels == lbl
        group_idx = indices[mask]
        n_sample = max(1, math.ceil(cnt / len(labels) * max_points))
        if n_sample >= cnt:
            sampled.append(group_idx)
        else:
            chosen = np.random.choice(group_idx, size=n_sample, replace=False)
            sampled.append(chosen)

    result = np.concatenate(sampled)
    np.random.shuffle(result)
    return result[:max_points]


def get_modes(db: Session, dataset_id: int) -> ModesResponse:
    ds: Dataset = ds_service.get_ready(db, dataset_id)
    obs = ds_service.load_obs(ds)
    return ModesResponse(
        dataset_id=ds.id,
        embedding_key=ds.embedding_key,
        embedding_options=_embedding_options(ds),
        vector_dim=ds.vector_dim,
        available_modes=_available_modes(ds.vector_dim),
        color_options=_color_options(obs),
    )


def get_embedding(
    db: Session,
    dataset_id: int,
    mode: str,
    color_by: str,
    max_points: int,
    embedding_key: str | None = None,
) -> EmbeddingResponse:
    ds: Dataset = ds_service.get_ready(db, dataset_id)
    vectors, resolved_embedding_key = _load_embedding_vectors(ds, embedding_key)

    available_modes = _available_modes(int(vectors.shape[1]))
    if mode not in available_modes:
        raise UnsupportedMode(mode, available_modes)

    cell_ids = ds_service.load_cell_ids(ds)    # shape (n,)
    obs = ds_service.load_obs(ds)              # DataFrame

    color_opts = _color_options(obs)
    if color_by not in color_opts:
        raise ColorByColumnNotFound(color_by, color_opts)

    n_total = len(cell_ids)
    all_indices = np.arange(n_total)
    labels = obs[color_by].astype(str).to_numpy()

    # 分层降采样
    sampled_idx = _stratified_sample(all_indices, labels, max_points)
    sampled_idx = np.sort(sampled_idx)   # 保持行顺序，便于批量切片

    # 提取坐标
    xs = vectors[sampled_idx, 0].tolist()
    ys = vectors[sampled_idx, 1].tolist()
    zs = vectors[sampled_idx, 2].tolist() if mode == "3d" else [None] * len(sampled_idx)

    # 构建点列表
    points: list[EmbeddingPoint] = []
    for i, row_idx in enumerate(sampled_idx):
        obs_row = obs.iloc[int(row_idx)]
        obs_dict = {col: _jsonable(obs_row[col]) for col in obs.columns}
        points.append(EmbeddingPoint(
            cell_id=str(cell_ids[row_idx]),
            x=float(xs[i]),
            y=float(ys[i]),
            z=float(zs[i]) if zs[i] is not None else None,
            label=labels[row_idx],
            obs=obs_dict,
        ))

    return EmbeddingResponse(
        dataset_id=ds.id,
        embedding_key=resolved_embedding_key,
        mode=mode,
        color_by=color_by,
        color_options=color_opts,
        n_total=n_total,
        n_returned=len(points),
        points=points,
    )


def locate_cells(
    db: Session,
    dataset_id: int,
    cell_ids: list[str],
    mode: str,
) -> LocateResponse:
    ds: Dataset = ds_service.get_ready(db, dataset_id)

    available_modes = _available_modes(ds.vector_dim)
    if mode not in available_modes:
        raise UnsupportedMode(mode, available_modes)

    vectors = ds_service.load_vectors(ds)
    all_cell_ids = ds_service.load_cell_ids(ds)

    # 建 cell_id → row_index 映射（O(1) 查找）
    id_to_row: dict[str, int] = {str(cid): i for i, cid in enumerate(all_cell_ids)}

    points: list[LocatePoint] = []
    for cid in cell_ids:
        row = id_to_row.get(cid)
        if row is None:
            continue
        points.append(LocatePoint(
            cell_id=cid,
            x=float(vectors[row, 0]),
            y=float(vectors[row, 1]),
            z=float(vectors[row, 2]) if mode == "3d" else None,
            row_index=int(row),
        ))

    return LocateResponse(
        dataset_id=ds.id,
        mode=mode,
        points=points,
    )


def _jsonable(v):
    import math as _math
    if isinstance(v, float) and _math.isnan(v):
        return None
    if hasattr(v, "item"):
        return v.item()
    return v if isinstance(v, (str, int, float, bool, type(None))) else str(v)


def _embedding_options(ds: Dataset) -> list[str]:
    options = [ds.embedding_key]
    source = Path(ds.source_path)
    if source.exists():
        adata = ad.read_h5ad(source, backed="r")
        try:
            options = list(dict.fromkeys([ds.embedding_key, *list(adata.obsm.keys())]))
        finally:
            if adata.isbacked:
                adata.file.close()
    return options


def _load_embedding_vectors(ds: Dataset, embedding_key: str | None) -> tuple[np.ndarray, str]:
    requested = embedding_key or ds.embedding_key
    if requested == ds.embedding_key:
        return ds_service.load_vectors(ds), ds.embedding_key

    source = Path(ds.source_path)
    adata = ad.read_h5ad(source, backed="r")
    try:
        available = list(adata.obsm.keys())
        if requested not in available:
            raise VisualizationEmbeddingNotFound(requested, available)
        vectors = np.asarray(adata.obsm[requested], dtype=np.float32)
        if vectors.ndim != 2:
            raise ValueError(f"obsm['{requested}'] 必须是 2D 矩阵，实际 shape={vectors.shape}")
        return np.ascontiguousarray(vectors), requested
    finally:
        if adata.isbacked:
            adata.file.close()
