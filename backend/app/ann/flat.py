"""暴力检索（精确）实现。

作为 ground truth：所有近似算法的 recall 都以此为基准；同时本身也作为可选的检索算法。
基于 FAISS 的 IndexFlatL2（L2 距离）或 IndexFlatIP（内积）实现。
"""
from __future__ import annotations

from pathlib import Path

import faiss
import numpy as np

from app.ann.base import BaseANNIndex


class FlatL2Index(BaseANNIndex):
    """精确 L2 暴力检索。"""

    def __init__(self, dim: int | None = None) -> None:
        self._dim = dim
        self._index: faiss.Index | None = None
        self._ids: np.ndarray | None = None  # 外部传入的 cell 整数 id，按内部行号对齐

    def build(self, vectors: np.ndarray, ids: list[int] | np.ndarray | None = None, **_: object) -> None:
        vectors = self._check_vectors(vectors)
        if self._dim is None:
            self._dim = vectors.shape[1]
        elif vectors.shape[1] != self._dim:
            raise ValueError(f"维度不匹配：期望 {self._dim}, 实际 {vectors.shape[1]}")

        index = faiss.IndexFlatL2(self._dim)
        index.add(vectors)
        self._index = index
        self._ids = (
            np.arange(vectors.shape[0], dtype=np.int64)
            if ids is None
            else np.asarray(ids, dtype=np.int64)
        )

    def search(self, query: np.ndarray, k: int) -> tuple[list[int], list[float]]:
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        q = self._prepare_query(query)
        k = min(k, self._index.ntotal)
        distances, idx = self._index.search(q, k)
        return self._ids[idx[0]].tolist(), distances[0].tolist()

    def save(self, path: str) -> None:
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(p))
        np.save(p.with_suffix(p.suffix + ".ids.npy"), self._ids, allow_pickle=False)

    def load(self, path: str) -> None:
        p = Path(path)
        self._index = faiss.read_index(str(p))
        self._ids = np.load(p.with_suffix(p.suffix + ".ids.npy"), allow_pickle=False)
        self._dim = self._index.d

    def add(self, vectors: np.ndarray, ids: list[int]) -> None:
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        vectors = self._check_vectors(vectors)
        self._index.add(vectors)
        self._ids = np.concatenate([self._ids, np.asarray(ids, dtype=np.int64)])

    def remove(self, ids: list[int]) -> None:  # noqa: D401
        # FAISS Flat 支持 remove_ids，但需要先把外部 id 映射回内部行号
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        to_remove = np.isin(self._ids, np.asarray(ids, dtype=np.int64))
        if not to_remove.any():
            return
        rows = np.where(to_remove)[0].astype(np.int64)
        selector = faiss.IDSelectorBatch(rows.size, faiss.swig_ptr(rows))
        self._index.remove_ids(selector)
        self._ids = self._ids[~to_remove]

    # ----- helpers -----

    @property
    def ntotal(self) -> int:
        return int(self._index.ntotal) if self._index is not None else 0

    @property
    def dim(self) -> int | None:
        return self._dim

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
