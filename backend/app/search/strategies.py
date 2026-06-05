"""条件过滤检索的三种策略实现。

调用约定：每个 strategy 函数都接收同一组输入（向量 + 过滤条件 + 索引 + 数据集 obs/cell_ids），
返回 `StrategyOutput`（行号、距离、统计信息）。所有"剔除查询自身"的逻辑由调用方完成；
策略只负责"挑出符合 filter 的 k 个最近邻"。

为什么是三种？参考 *Filtered ANN Search Benchmark 2025* (arxiv 2509.07789)：
- **post-filter**：ANN 召回 k*oversample → 过滤截 k。低选择度时易返回不足。
- **pre-filter**：先按 obs 算出允许集 → 在子集上暴力 L2。选择度低时极快且精确。
- **hybrid**（仅 HNSW）：在图遍历时直接剪掉不符合 obs 的节点（ACORN 风格）。
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

import numpy as np
import pandas as pd

from app.ann.hnsw import HNSWIndex
from app.core import filters as obs_filters
from app.search.schemas import SearchFilter

if TYPE_CHECKING:
    from app.ann.base import BaseANNIndex


# ---------- 公共契约 ----------

@dataclass
class StrategyOutput:
    rows: list[int]              # 行号（已按距离升序、已应用 filter）
    distances: list[float]
    latency_ms: float
    extra: dict = field(default_factory=dict)  # 策略特有的统计（如 fetch_k、subset_size）


# ---------- 工具 ----------

def _row_matches(row: pd.Series, filters: SearchFilter) -> bool:
    return obs_filters.matches_row(row, filters)


def compute_allowed_rows(obs: pd.DataFrame, filters: SearchFilter) -> np.ndarray:
    """向量化计算"满足 filters 的行号"。返回升序 int64 数组。

    比 row-by-row 的 _row_matches 快 1-2 个数量级，但功能等价。
    """
    return obs_filters.compute_allowed_rows(obs, filters)


# ---------- 策略 1：post-filter ----------

def post_filter_search(
    *,
    ann_index: "BaseANNIndex",
    query_vec: np.ndarray,
    k: int,
    filters: SearchFilter,
    obs: pd.DataFrame,
    n_total: int,
    oversample: int,
    exclude_row: int | None = None,
) -> StrategyOutput:
    """先用 ANN 召回 k*oversample 个候选，再过滤截 k。"""
    fetch_k = min(k * oversample, n_total)
    t0 = time.perf_counter()
    rows, dists = ann_index.search(query_vec, k=fetch_k)
    out_rows: list[int] = []
    out_dists: list[float] = []
    for r, d in zip(rows, dists):
        if exclude_row is not None and r == exclude_row:
            continue
        if not _row_matches(obs.iloc[r], filters):
            continue
        out_rows.append(int(r))
        out_dists.append(float(d))
        if len(out_rows) >= k:
            break
    elapsed = (time.perf_counter() - t0) * 1000.0
    return StrategyOutput(
        rows=out_rows,
        distances=out_dists,
        latency_ms=elapsed,
        extra={"fetch_k": fetch_k, "oversample": oversample},
    )


# ---------- 策略 2：pre-filter ----------

def pre_filter_search(
    *,
    vectors: np.ndarray,
    obs: pd.DataFrame,
    query_vec: np.ndarray,
    k: int,
    filters: SearchFilter,
    exclude_row: int | None = None,
) -> StrategyOutput:
    """先用 obs 选出允许行集合，再在子集上暴力 L2。

    在子集 ≤ 几千的场景下比 ANN 还快，因为完全免去了图遍历开销；
    且在过滤后是精确的（recall=1.0 within subset）。
    """
    t0 = time.perf_counter()
    allowed = compute_allowed_rows(obs, filters)
    if exclude_row is not None:
        allowed = allowed[allowed != exclude_row]
    if allowed.size == 0:
        return StrategyOutput(
            rows=[], distances=[],
            latency_ms=(time.perf_counter() - t0) * 1000.0,
            extra={"subset_size": 0},
        )

    subset = vectors[allowed]
    diff = subset - query_vec.reshape(1, -1).astype(subset.dtype)
    dists = np.einsum("ij,ij->i", diff, diff)  # 平方距离即可（不开根，比较结果一致）
    take = min(k, dists.size)
    top_idx = np.argpartition(dists, take - 1)[:take]
    top_idx = top_idx[np.argsort(dists[top_idx])]

    elapsed = (time.perf_counter() - t0) * 1000.0
    return StrategyOutput(
        rows=allowed[top_idx].tolist(),
        distances=dists[top_idx].astype(float).tolist(),
        latency_ms=elapsed,
        extra={"subset_size": int(allowed.size)},
    )


# ---------- 策略 3：hybrid（HNSW only） ----------

def hybrid_hnsw_search(
    *,
    ann_index: "BaseANNIndex",
    obs: pd.DataFrame,
    query_vec: np.ndarray,
    k: int,
    filters: SearchFilter,
    n_total: int,
    exclude_row: int | None = None,
) -> StrategyOutput:
    """在 HNSW 图遍历时直接剪掉不符合条件的节点（hnswlib filter 回调）。

    仅支持 HNSWIndex。其它算法应回退到 post 或 pre。
    """
    if not isinstance(ann_index, HNSWIndex):
        raise TypeError(f"hybrid 策略仅支持 HNSWIndex，收到 {type(ann_index).__name__}")

    t0 = time.perf_counter()
    allowed = compute_allowed_rows(obs, filters)
    if exclude_row is not None:
        allowed = allowed[allowed != exclude_row]
    if allowed.size == 0:
        return StrategyOutput(
            rows=[], distances=[],
            latency_ms=(time.perf_counter() - t0) * 1000.0,
            extra={"subset_size": 0},
        )

    allow_set = set(allowed.tolist())
    fetch_k = min(k, allow_set.__len__(), n_total)
    rows, dists = ann_index.search_with_filter(query_vec, k=fetch_k, allow_row=allow_set)

    # hnswlib 在 filter 极严时可能返回不足 k 个；这里如实返回。
    elapsed = (time.perf_counter() - t0) * 1000.0
    return StrategyOutput(
        rows=[int(r) for r in rows],
        distances=[float(d) for d in dists],
        latency_ms=elapsed,
        extra={"subset_size": int(allowed.size), "requested_k": fetch_k},
    )


# ---------- 注册表 ----------

STRATEGY_NAMES: tuple[str, ...] = ("post", "pre", "hybrid")
