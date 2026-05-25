"""FAISS-based ANN indexes beyond Flat and HNSW."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import faiss
import numpy as np

from app.ann.base import BaseANNIndex


class FaissIndex(BaseANNIndex):
    """Shared FAISS index behavior with external id support."""

    def __init__(self, dim: Optional[int] = None) -> None:
        self._dim = dim
        self._index: Optional[faiss.Index] = None

    def build(
        self,
        vectors: np.ndarray,
        ids: Optional[np.ndarray] = None,
        **_: object,
    ) -> None:
        vectors = self._check_vectors(vectors)
        n, d = vectors.shape
        if self._dim is None:
            self._dim = d
        elif d != self._dim:
            raise ValueError(f"维度不匹配：期望 {self._dim}, 实际 {d}")

        labels = np.arange(n, dtype=np.int64) if ids is None else np.asarray(ids, dtype=np.int64)
        if labels.shape[0] != n:
            raise ValueError(f"ids 数量 {labels.shape[0]} 与向量数量 {n} 不一致")

        index = faiss.IndexIDMap2(self._create_index(vectors))
        if not index.is_trained:
            index.train(vectors)
        index.add_with_ids(vectors, labels)
        self._configure_search(index)
        self._index = index

    def search(self, query: np.ndarray, k: int) -> tuple[list[int], list[float]]:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        q = self._prepare_query(query)
        k = min(k, self._index.ntotal)
        distances, idx = self._index.search(q, k)
        valid = idx[0] >= 0
        return idx[0][valid].tolist(), distances[0][valid].tolist()

    def save(self, path: str) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(p))

    def load(self, path: str) -> None:
        self._index = faiss.read_index(str(path))
        self._dim = self._index.d
        self._configure_search(self._index)

    def add(self, vectors: np.ndarray, ids: list[int]) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        vectors = self._check_vectors(vectors)
        if vectors.shape[1] != self._dim:
            raise ValueError(f"维度不匹配：期望 {self._dim}, 实际 {vectors.shape[1]}")
        labels = np.asarray(ids, dtype=np.int64)
        if labels.shape[0] != vectors.shape[0]:
            raise ValueError(f"ids 数量 {labels.shape[0]} 与向量数量 {vectors.shape[0]} 不一致")
        self._index.add_with_ids(vectors, labels)

    def remove(self, ids: list[int]) -> None:
        if self._index is None:
            raise RuntimeError("索引尚未构建")
        labels = np.asarray(ids, dtype=np.int64)
        selector = faiss.IDSelectorBatch(labels.size, faiss.swig_ptr(labels))
        self._index.remove_ids(selector)

    @property
    def ntotal(self) -> int:
        return int(self._index.ntotal) if self._index is not None else 0

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        raise NotImplementedError

    def _configure_search(self, index: faiss.Index) -> None:
        return None

    def _check_vectors(self, vectors: np.ndarray) -> np.ndarray:
        if vectors.dtype != np.float32:
            vectors = vectors.astype(np.float32)
        if vectors.ndim != 2:
            raise ValueError("向量矩阵必须是二维数组")
        return np.ascontiguousarray(vectors)

    def _prepare_query(self, query: np.ndarray) -> np.ndarray:
        if query.dtype != np.float32:
            query = query.astype(np.float32)
        if query.ndim == 1:
            query = query.reshape(1, -1)
        if self._dim is not None and query.shape[1] != self._dim:
            raise ValueError(f"查询维度 {query.shape[1]} 与索引维度 {self._dim} 不一致")
        return np.ascontiguousarray(query)


def _safe_nlist(n_vectors: int, requested: int) -> int:
    return max(1, min(int(requested), int(n_vectors)))


def _safe_m(dim: int, requested: int) -> int:
    m = max(1, min(int(requested), int(dim)))
    while dim % m != 0:
        m -= 1
    return max(1, m)


def _safe_nbits(n_vectors: int, requested: int) -> int:
    nbits = max(1, min(int(requested), 8))
    while nbits > 1 and (1 << nbits) > n_vectors:
        nbits -= 1
    return nbits


class LSHIndex(FaissIndex):
    """Locality-sensitive hashing index."""

    def __init__(self, dim: Optional[int] = None, nbits: Optional[int] = None) -> None:
        super().__init__(dim=dim)
        self._nbits = nbits

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        dim = int(self._dim or vectors.shape[1])
        nbits = int(self._nbits or dim * 2)
        return faiss.IndexLSH(dim, max(1, nbits))


class IVFIndex(FaissIndex):
    """Inverted file index with Flat lists."""

    DEFAULT_NLIST = 100
    DEFAULT_NPROBE = 10

    def __init__(
        self,
        dim: Optional[int] = None,
        nlist: int = DEFAULT_NLIST,
        nprobe: int = DEFAULT_NPROBE,
    ) -> None:
        super().__init__(dim=dim)
        self._nlist = nlist
        self._nprobe = nprobe

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        dim = int(self._dim or vectors.shape[1])
        nlist = _safe_nlist(vectors.shape[0], self._nlist)
        quantizer = faiss.IndexFlatL2(dim)
        return faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_L2)

    def _configure_search(self, index: faiss.Index) -> None:
        ivf = faiss.extract_index_ivf(index)
        ivf.nprobe = max(1, min(int(self._nprobe), int(ivf.nlist)))


class PQIndex(FaissIndex):
    """Product quantization index."""

    DEFAULT_M = 8
    DEFAULT_NBITS = 8

    def __init__(
        self,
        dim: Optional[int] = None,
        m: int = DEFAULT_M,
        nbits: int = DEFAULT_NBITS,
    ) -> None:
        super().__init__(dim=dim)
        self._m = m
        self._nbits = nbits

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        dim = int(self._dim or vectors.shape[1])
        m = _safe_m(dim, self._m)
        nbits = _safe_nbits(vectors.shape[0], self._nbits)
        return faiss.IndexPQ(dim, m, nbits)


class OPQIndex(PQIndex):
    """Optimized product quantization index."""

    DEFAULT_NITER = 5

    def __init__(
        self,
        dim: Optional[int] = None,
        m: int = PQIndex.DEFAULT_M,
        nbits: int = PQIndex.DEFAULT_NBITS,
        niter: int = DEFAULT_NITER,
    ) -> None:
        super().__init__(dim=dim, m=m, nbits=nbits)
        self._niter = niter

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        dim = int(self._dim or vectors.shape[1])
        m = _safe_m(dim, self._m)
        nbits = _safe_nbits(vectors.shape[0], self._nbits)

        opq = faiss.OPQMatrix(dim, m)
        opq.niter = max(1, int(self._niter))
        opq.niter_pq = 1
        opq.niter_pq_0 = 1
        opq.pq = faiss.ProductQuantizer(dim, m, nbits)
        return faiss.IndexPreTransform(opq, faiss.IndexPQ(dim, m, nbits))


class IVFPQIndex(FaissIndex):
    """Inverted file index with product-quantized lists."""

    DEFAULT_NLIST = 100
    DEFAULT_NPROBE = 10
    DEFAULT_M = 8
    DEFAULT_NBITS = 8

    def __init__(
        self,
        dim: Optional[int] = None,
        nlist: int = DEFAULT_NLIST,
        nprobe: int = DEFAULT_NPROBE,
        m: int = DEFAULT_M,
        nbits: int = DEFAULT_NBITS,
    ) -> None:
        super().__init__(dim=dim)
        self._nlist = nlist
        self._nprobe = nprobe
        self._m = m
        self._nbits = nbits

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        dim = int(self._dim or vectors.shape[1])
        nlist = _safe_nlist(vectors.shape[0], self._nlist)
        m = _safe_m(dim, self._m)
        nbits = _safe_nbits(vectors.shape[0], self._nbits)
        quantizer = faiss.IndexFlatL2(dim)
        return faiss.IndexIVFPQ(quantizer, dim, nlist, m, nbits)

    def _configure_search(self, index: faiss.Index) -> None:
        ivf = faiss.extract_index_ivf(index)
        ivf.nprobe = max(1, min(int(self._nprobe), int(ivf.nlist)))


class IVFHNSWIndex(IVFIndex):
    """Inverted file index using HNSW as the coarse quantizer."""

    DEFAULT_M = 32

    def __init__(
        self,
        dim: Optional[int] = None,
        nlist: int = IVFIndex.DEFAULT_NLIST,
        nprobe: int = IVFIndex.DEFAULT_NPROBE,
        m: int = DEFAULT_M,
    ) -> None:
        super().__init__(dim=dim, nlist=nlist, nprobe=nprobe)
        self._m = m

    def _create_index(self, vectors: np.ndarray) -> faiss.Index:
        dim = int(self._dim or vectors.shape[1])
        nlist = _safe_nlist(vectors.shape[0], self._nlist)
        quantizer = faiss.IndexHNSWFlat(dim, max(1, int(self._m)))
        return faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_L2)
