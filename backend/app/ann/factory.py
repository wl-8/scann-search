"""算法工厂：根据名称和参数返回对应 Index 实例。

调用方（index.service）只需要知道算法名和参数 dict，不需要 import 具体类。
新增算法只需在这里登记。
"""
from __future__ import annotations

from app.ann.base import BaseANNIndex
from app.ann.faiss_indexes import IVFHNSWIndex, IVFPQIndex, LSHIndex, OPQIndex, PQIndex
from app.ann.flat import FlatL2Index
from app.ann.hnsw import HNSWIndex
from app.ann.ivf import IVFFlatIndex
from app.index import constants as algo


def create_index(algorithm: str, dim: int | None = None, **params: object) -> BaseANNIndex:
    """按算法名实例化索引（不构建）。

    Args:
        algorithm: 算法名，参见 app.index.constants
        dim: 向量维度。Flat 在 build 时可推断；HNSW/IVF 推荐显式给出。
        params: 算法专属参数，未识别的会被忽略。
    """
    name = algorithm.lower()
    if name == algo.ALGO_FLAT:
        return FlatL2Index(dim=dim)
    if name == algo.ALGO_LSH:
        nbits = params.get("nbits")
        return LSHIndex(dim=dim, nbits=None if nbits is None else int(nbits))
    if name == algo.ALGO_HNSW:
        return HNSWIndex(
            dim=dim,
            space=str(params.get("space", "l2")),
            m=int(params.get("M", HNSWIndex.DEFAULT_M)),
            ef_construction=int(params.get("ef_construction", HNSWIndex.DEFAULT_EF_CONSTRUCTION)),
            ef_search=int(params.get("ef_search", HNSWIndex.DEFAULT_EF_SEARCH)),
        )
    if name == algo.ALGO_IVF:
        return IVFFlatIndex(
            dim=dim,
            nlist=int(params.get("nlist", IVFFlatIndex.DEFAULT_NLIST)),
            nprobe=int(params.get("nprobe", IVFFlatIndex.DEFAULT_NPROBE)),
        )
    if name == algo.ALGO_PQ:
        return PQIndex(
            dim=dim,
            m=int(params.get("m", PQIndex.DEFAULT_M)),
            nbits=int(params.get("nbits", PQIndex.DEFAULT_NBITS)),
        )
    if name == algo.ALGO_OPQ:
        return OPQIndex(
            dim=dim,
            m=int(params.get("m", OPQIndex.DEFAULT_M)),
            nbits=int(params.get("nbits", OPQIndex.DEFAULT_NBITS)),
            niter=int(params.get("niter", OPQIndex.DEFAULT_NITER)),
        )
    if name == algo.ALGO_IVF_PQ:
        return IVFPQIndex(
            dim=dim,
            nlist=int(params.get("nlist", IVFPQIndex.DEFAULT_NLIST)),
            nprobe=int(params.get("nprobe", IVFPQIndex.DEFAULT_NPROBE)),
            m=int(params.get("m", IVFPQIndex.DEFAULT_M)),
            nbits=int(params.get("nbits", IVFPQIndex.DEFAULT_NBITS)),
        )
    if name == algo.ALGO_IVF_HNSW:
        return IVFHNSWIndex(
            dim=dim,
            nlist=int(params.get("nlist", IVFHNSWIndex.DEFAULT_NLIST)),
            nprobe=int(params.get("nprobe", IVFHNSWIndex.DEFAULT_NPROBE)),
            m=int(params.get("M", IVFHNSWIndex.DEFAULT_M)),
        )
    raise NotImplementedError(f"算法 {algorithm} 未实现")


SUPPORTED_ALGORITHMS: tuple[str, ...] = (
    algo.ALGO_FLAT,
    algo.ALGO_HNSW,
    algo.ALGO_LSH,
    algo.ALGO_IVF,
    algo.ALGO_PQ,
    algo.ALGO_OPQ,
    algo.ALGO_IVF_PQ,
    algo.ALGO_IVF_HNSW,
)
