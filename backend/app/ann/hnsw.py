"""HNSW 实现（基于 hnswlib）。

为何用 hnswlib 而非 faiss.IndexHNSW：
- 原生支持按外部 id 增删（mark_deleted、add_items 用 ids 参数）
- Windows pip 安装稳定
- API 简洁
"""
from __future__ import annotations

from pathlib import Path

import hnswlib
import numpy as np

from app.ann.base import BaseANNIndex


class HNSWIndex(BaseANNIndex):
    """图结构 ANN。"""

    DEFAULT_M = 16
    DEFAULT_EF_CONSTRUCTION = 200
    DEFAULT_EF_SEARCH = 50

    def __init__(
        self,
        dim: int | None = None,
        space: str = "l2",
        m: int = DEFAULT_M,
        ef_construction: int = DEFAULT_EF_CONSTRUCTION,
        ef_search: int = DEFAULT_EF_SEARCH,
    ) -> None:
        if space not in ("l2", "ip", "cosine"):
            raise ValueError(f"不支持的距离 space='{space}'，可选: l2/ip/cosine")
        self._dim = dim
        self._space = space
        self._m = m
        self._ef_construction = ef_construction
        self._ef_search = ef_search
        self._index: hnswlib.Index | None = None
        self._capacity = 0

    def build(
        self,
        vectors: np.ndarray,
        ids: list[int] | np.ndarray | None = None,
        max_elements: int | None = None,
        **_: object,
    ) -> None:
        vectors = self._check_vectors(vectors)
        n, d = vectors.shape
        if self._dim is None:
            self._dim = d
        elif d != self._dim:
            raise ValueError(f"维度不匹配：期望 {self._dim}, 实际 {d}")

        capacity = max_elements or max(n * 2, n + 1024)
        index = hnswlib.Index(space=self._space, dim=self._dim)
        index.init_index(max_elements=capacity, ef_construction=self._ef_construction, M=self._m)

        labels = np.arange(n, dtype=np.int64) if ids is None else np.asarray(ids, dtype=np.int64)
        index.add_items(vectors, labels)
        index.set_ef(self._ef_search)

        self._index = index
        self._capacity = capacity

    def search(self, query: np.ndarray, k: int) -> tuple[list[int], list[float]]:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        q = self._prepare_query(query)
        k = min(k, self._index.get_current_count())
        labels, distances = self._index.knn_query(q, k=k)
        return labels[0].tolist(), distances[0].tolist()

    def save(self, path: str) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        self._index.save_index(str(p))

    def load(self, path: str, max_elements: int | None = None) -> None:
        if self._dim is None:
            raise RuntimeError("load 前需要先设置 dim（通过构造函数）")
        index = hnswlib.Index(space=self._space, dim=self._dim)
        index.load_index(str(path), max_elements=max_elements or 0)
        index.set_ef(self._ef_search)
        self._index = index
        self._capacity = index.get_max_elements()

    def add(self, vectors: np.ndarray, ids: list[int]) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        vectors = self._check_vectors(vectors)
        labels = np.asarray(ids, dtype=np.int64)
        need = self._index.get_current_count() + labels.size
        if need > self._capacity:
            new_cap = max(self._capacity * 2, need + 1024)
            self._index.resize_index(new_cap)
            self._capacity = new_cap
        self._index.add_items(vectors, labels)

    def remove(self, ids: list[int]) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        for i in ids:
            self._index.mark_deleted(int(i))

    # ----- helpers -----

    def set_ef_search(self, ef: int) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        self._ef_search = ef
        self._index.set_ef(ef)

    @property
    def ntotal(self) -> int:
        return int(self._index.get_current_count()) if self._index is not None else 0

    @property
    def params(self) -> dict[str, object]:
        return {
            "space": self._space,
            "M": self._m,
            "ef_construction": self._ef_construction,
            "ef_search": self._ef_search,
        }

    def _check_vectors(self, vectors: np.ndarray) -> np.ndarray:
        if vectors.dtype != np.float32:
            vectors = vectors.astype(np.float32)
        return np.ascontiguousarray(vectors)

    def _prepare_query(self, query: np.ndarray) -> np.ndarray:
        if query.dtype != np.float32:
            query = query.astype(np.float32)
        if query.ndim == 1:
            query = query.reshape(1, -1)
        if self._dim is not None and query.shape[1] != self._dim:
            raise ValueError(f"查询维度 {query.shape[1]} 与索引维度 {self._dim} 不一致")
        return np.ascontiguousarray(query)
