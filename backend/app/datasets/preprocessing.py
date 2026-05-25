"""单细胞 .h5ad → (向量矩阵, 细胞ID, obs 元数据) 的抽取流程。

只做"读"和"产出工件"两件事；写库交给 service 层。
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import anndata as ad
import numpy as np
import pandas as pd


@dataclass(frozen=True)
class ExtractedDataset:
    """从 .h5ad 抽取后的中间产物。"""
    vectors: np.ndarray         # float32, shape (n_cells, d)
    cell_ids: np.ndarray        # dtype=object, shape (n_cells,)
    obs: pd.DataFrame           # 细胞元数据
    n_cells: int
    n_genes: int
    vector_dim: int
    embedding_key: str


def load_h5ad(source_path: str | Path, embedding_key: str = "X_pca") -> ExtractedDataset:
    """读 .h5ad 并抽出指定 obsm key 作为向量。

    采用 backed='r' 模式读取以避免把完整稠密矩阵加载到内存；
    obsm/obs 体量小可全量读出。
    """
    path = Path(source_path)
    if not path.exists():
        raise FileNotFoundError(f"未找到 .h5ad 文件：{path}")

    adata = ad.read_h5ad(path, backed="r")
    try:
        if embedding_key not in adata.obsm:
            raise KeyError(
                f"obsm 中没有 '{embedding_key}'，可用 keys：{list(adata.obsm.keys())}"
            )

        vectors = np.asarray(adata.obsm[embedding_key], dtype=np.float32)
        if vectors.ndim != 2:
            raise ValueError(f"obsm['{embedding_key}'] 必须是 2D 矩阵，实际 shape={vectors.shape}")

        cell_ids = adata.obs_names.to_numpy().astype(object)
        obs = adata.obs.copy()
        # 把 categorical 转 str，便于 parquet 持久化与 JSON 序列化
        for col in obs.select_dtypes(include=["category"]).columns:
            obs[col] = obs[col].astype(str)

        return ExtractedDataset(
            vectors=np.ascontiguousarray(vectors),
            cell_ids=cell_ids,
            obs=obs,
            n_cells=int(adata.n_obs),
            n_genes=int(adata.n_vars),
            vector_dim=int(vectors.shape[1]),
            embedding_key=embedding_key,
        )
    finally:
        if adata.isbacked:
            adata.file.close()


def persist_artifacts(
    extracted: ExtractedDataset,
    vectors_path: str | Path,
    cell_ids_path: str | Path,
    obs_path: str | Path,
) -> None:
    """把抽取产物落到磁盘上的 .npy / .parquet。"""
    Path(vectors_path).parent.mkdir(parents=True, exist_ok=True)

    np.save(vectors_path, extracted.vectors, allow_pickle=False)
    np.save(cell_ids_path, extracted.cell_ids, allow_pickle=True)
    extracted.obs.to_parquet(obs_path, index=True)


def load_vectors(vectors_path: str | Path) -> np.ndarray:
    arr = np.load(vectors_path, allow_pickle=False)
    return np.ascontiguousarray(arr, dtype=np.float32)


def load_cell_ids(cell_ids_path: str | Path) -> np.ndarray:
    return np.load(cell_ids_path, allow_pickle=True)


def load_obs(obs_path: str | Path) -> pd.DataFrame:
    return pd.read_parquet(obs_path)
