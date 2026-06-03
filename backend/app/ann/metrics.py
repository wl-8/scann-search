"""距离度量工具。

设计取舍：索引一律用 **L2 空间** 构建。cosine 模式下，在构建前把库向量做 L2 归一化、
检索前把查询向量做同样归一化——归一化后向量的 L2 距离与余弦距离单调等价，因此对所有
算法（Flat/IVF/PQ/HNSW…）都成立，无需每个算法各自支持 cosine，也不必切换 FAISS metric。
"""
from __future__ import annotations

import numpy as np

_EPS = 1e-8


def l2_normalize(x: np.ndarray) -> np.ndarray:
    """对向量(1D)或向量矩阵(2D，按行)做 L2 归一化，返回 **新数组**（不修改入参）。

    零向量保持原样（避免除零）。返回 float32、C-contiguous，便于直接喂给 FAISS/hnswlib。
    """
    arr = np.asarray(x, dtype=np.float32)
    if arr.ndim == 1:
        norm = float(np.linalg.norm(arr))
        out = arr / norm if norm > _EPS else arr.copy()
    elif arr.ndim == 2:
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms = np.where(norms < _EPS, 1.0, norms)
        out = arr / norms
    else:
        raise ValueError(f"l2_normalize 只支持 1D/2D，收到 ndim={arr.ndim}")
    return np.ascontiguousarray(out, dtype=np.float32)
