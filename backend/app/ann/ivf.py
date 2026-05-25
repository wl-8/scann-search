"""IVF（Inverted File Index）近似检索实现。

基于 FAISS IndexIVFFlat：先用 k-means 把向量空间划分为 nlist 个 Voronoi 格，
查询时只探测距离最近的 nprobe 个格，大幅减少比较次数。

关键参数：
  nlist  —— 聚类中心数，通常取 sqrt(n)，n 为向量数
  nprobe —— 查询时探测的格数，越大 recall 越高但速度越慢
"""
from __future__ import annotations

import math
from pathlib import Path

import faiss
import numpy as np

from app.ann.base import BaseANNIndex


class IVFFlatIndex(BaseANNIndex):
    DEFAULT_NLIST = 100
    DEFAULT_NPROBE = 10

    def __init__(
        self,
        dim: int | None = None,
        nlist: int = DEFAULT_NLIST,
        nprobe: int = DEFAULT_NPROBE,
    ) -> None:
        self._dim = dim
        self._nlist = nlist
        self._nprobe = nprobe
        self._index: faiss.Index | None = None
        self._ids: np.ndarray | None = None

    # ------------------------------------------------------------------
    # 公开接口
    # ------------------------------------------------------------------

    def build(self, vectors: np.ndarray, ids: list[int] | np.ndarray | None = None, **_: object) -> None:
        vectors = self._coerce(vectors)
        n, d = vectors.shape
        if self._dim is None:
            self._dim = d
        elif d != self._dim:
            raise ValueError(f"维度不匹配：期望 {self._dim}, 实际 {d}")

        # nlist 不能超过向量数；建议至少 39 倍（FAISS 文档建议），此处取保守值
        nlist = min(self._nlist, max(1, n // 4))
        if nlist != self._nlist:
            self._nlist = nlist

        quantizer = faiss.IndexFlatL2(d)
        index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_L2)
        index.train(vectors)
        index.add(vectors)
        index.nprobe = self._nprobe

        self._index = index
        self._ids = (
            np.arange(n, dtype=np.int64)
            if ids is None
            else np.asarray(ids, dtype=np.int64)
        )

    def search(self, query: np.ndarray, k: int) -> tuple[list[int], list[float]]:
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        q = self._coerce_query(query)
        k = min(k, self._index.ntotal)
        distances, idx = self._index.search(q, k)
        # idx 是内部行号，映射回外部 id
        valid = idx[0] >= 0  # FAISS 不足 k 时填 -1
        return self._ids[idx[0][valid]].tolist(), distances[0][valid].tolist()

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
        # 恢复 nprobe
        self._index.nprobe = self._nprobe

    def add(self, vectors: np.ndarray, ids: list[int]) -> None:
        """追加向量（不重新训练，仅适合少量增量）。"""
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        vectors = self._coerce(vectors)
        self._index.add(vectors)
        self._ids = np.concatenate([self._ids, np.asarray(ids, dtype=np.int64)])

    def remove(self, ids: list[int]) -> None:
        """标记删除：从 _ids 映射中剔除，下次 search 不会返回这些行。

        IVFFlat 不原生支持 remove_ids，此处用 IDSelectorBatch 实现。
        """
        if self._index is None or self._ids is None:
            raise RuntimeError("索引尚未构建")
        to_remove = np.isin(self._ids, np.asarray(ids, dtype=np.int64))
        if not to_remove.any():
            return
        rows = np.where(to_remove)[0].astype(np.int64)
        selector = faiss.IDSelectorBatch(rows.size, faiss.swig_ptr(rows))
        self._index.remove_ids(selector)
        self._ids = self._ids[~to_remove]

    # ------------------------------------------------------------------
    # 属性
    # ------------------------------------------------------------------

    @property
    def ntotal(self) -> int:
        return int(self._index.ntotal) if self._index is not None else 0

    @property
    def dim(self) -> int | None:
        return self._dim

    @property
    def params(self) -> dict[str, object]:
        return {"nlist": self._nlist, "nprobe": self._nprobe}

    def set_nprobe(self, nprobe: int) -> None:
        self._nprobe = nprobe
        if self._index is not None:
            self._index.nprobe = nprobe

    # ------------------------------------------------------------------
    # 内部工具
    # ------------------------------------------------------------------

    @staticmethod
    def _coerce(vectors: np.ndarray) -> np.ndarray:
        if vectors.dtype != np.float32:
            vectors = vectors.astype(np.float32)
        return np.ascontiguousarray(vectors)

    def _coerce_query(self, query: np.ndarray) -> np.ndarray:
        if query.dtype != np.float32:
            query = query.astype(np.float32)
        if query.ndim == 1:
            query = query.reshape(1, -1)
        if self._dim is not None and query.shape[1] != self._dim:
            raise ValueError(f"查询维度 {query.shape[1]} 与索引维度 {self._dim} 不一致")
        return np.ascontiguousarray(query)

    @staticmethod
    def suggest_nlist(n_vectors: int) -> int:
        """根据向量数给出推荐的 nlist（FAISS 经验公式：4*sqrt(n)）。"""
        return max(1, int(4 * math.sqrt(n_vectors)))
