"""算法工厂：根据名称和参数返回对应 Index 实例。

调用方（index.service）只需要知道算法名和参数 dict，不需要 import 具体类。
新增算法只需在这里登记。
"""
from __future__ import annotations

from app.ann.base import BaseANNIndex
from app.ann.flat import FlatL2Index
from app.ann.hnsw import HNSWIndex
from app.index import constants as algo


def create_index(algorithm: str, dim: int | None = None, **params: object) -> BaseANNIndex:
    """按算法名实例化索引（不构建）。

    Args:
        algorithm: 算法名，参见 app.index.constants
        dim: 向量维度。Flat 在 build 时可推断；HNSW 推荐显式给出。
        params: 算法专属参数，未识别的会被忽略。
    """
    name = algorithm.lower()
    if name == algo.ALGO_FLAT:
        return FlatL2Index(dim=dim)
    if name == algo.ALGO_HNSW:
        return HNSWIndex(
            dim=dim,
            space=str(params.get("space", "l2")),
            m=int(params.get("M", HNSWIndex.DEFAULT_M)),
            ef_construction=int(params.get("ef_construction", HNSWIndex.DEFAULT_EF_CONSTRUCTION)),
            ef_search=int(params.get("ef_search", HNSWIndex.DEFAULT_EF_SEARCH)),
        )
    raise NotImplementedError(f"算法 {algorithm} 未实现")


SUPPORTED_ALGORITHMS: tuple[str, ...] = (algo.ALGO_FLAT, algo.ALGO_HNSW)
