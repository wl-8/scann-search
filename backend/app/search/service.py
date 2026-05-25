"""检索业务逻辑：top-k + 条件过滤。

过滤策略采用 **post-filter**：先用 ANN 召回 k*oversample 个候选，再按 obs 字段过滤截到 k。
oversample 可由调用方指定；不指定时根据过滤条件在数据集中的选择率自动推断，
避免低选择率条件（罕见细胞类型）召回不足、高选择率条件浪费算力。
"""
from __future__ import annotations

import math
import time
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.datasets import service as ds_service
from app.index import service as idx_service
from app.search.exceptions import CellNotFound, InvalidQueryVector
from app.search.schemas import (
    BatchHit,
    BatchSearchRequest,
    BatchSearchResponse,
    SearchByCellRequest,
    SearchByVectorRequest,
    SearchFilter,
    SearchHit,
    SearchResponse,
)


def search_by_cell(db: Session, req: SearchByCellRequest) -> SearchResponse:
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)
    vectors = ds_service.load_vectors(ds)

    try:
        row = ds_service.find_cell_row(ds, req.cell_id)
    except ValueError as e:
        raise CellNotFound(req.cell_id, ds.id) from e

    query_vec = _apply_metric(vectors[row], req.metric)
    oversample = req.oversample or _auto_oversample(ds, req.filters, req.k)
    return _execute_search(
        db=db,
        index_obj=idx_obj,
        dataset=ds,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        oversample=oversample,
        exclude_row=row,
        metric=req.metric,
    )


def search_by_vector(db: Session, req: SearchByVectorRequest) -> SearchResponse:
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)

    query_vec = np.asarray(req.vector, dtype=np.float32)
    if query_vec.shape[0] != ds.vector_dim:
        raise InvalidQueryVector(query_vec.shape[0], ds.vector_dim)

    query_vec = _apply_metric(query_vec, req.metric)
    oversample = req.oversample or _auto_oversample(ds, req.filters, req.k)
    return _execute_search(
        db=db,
        index_obj=idx_obj,
        dataset=ds,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        oversample=oversample,
        metric=req.metric,
    )


# ---------- 自适应 oversample ----------

def _auto_oversample(ds, filters: SearchFilter | None, k: int) -> int:
    """根据过滤条件在数据集中的选择率估算 oversample。

    仅对 equals 字段做统计（gte/lte 无法从 value_counts 推断），
    估算结果保守偏大，上限 500，下限 2。
    """
    if filters is None or not filters.equals:
        return 2  # 无过滤条件，稍微多取一点用于剔除查询自身

    stats = ds_service.value_counts(ds)
    selectivity = 1.0
    for col, allowed in filters.equals.items():
        col_counts = stats.get(col, {})
        total = sum(col_counts.values()) or 1
        hit = sum(col_counts.get(v, 0) for v in allowed)
        selectivity *= hit / total

    selectivity = max(selectivity, 0.005)  # 防止极端稀疏条件导致 oversample 爆炸
    needed = math.ceil(1.0 / selectivity)  # 期望命中 k 个有效 hit 需要多取 1/selectivity 倍
    return min(max(needed, 2), 500)


def _apply_metric(vec: np.ndarray, metric: str) -> np.ndarray:
    """cosine 模式下对查询向量做 L2 归一化，使索引的 L2 距离等价于余弦距离。"""
    if metric == "cosine":
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 1e-8 else vec
    return vec


# ---------- 核心 ----------

def _execute_search(
    db: Session,
    index_obj,
    dataset,
    query_vec: np.ndarray,
    k: int,
    filters: SearchFilter | None,
    oversample: int,
    exclude_row: int | None = None,
    metric: str = "l2",
) -> SearchResponse:
    instance = idx_service.load_index_instance(index_obj)
    obs = ds_service.load_obs(dataset)
    cell_ids = ds_service.load_cell_ids(dataset)

    has_filter = filters is not None and bool(filters.equals or filters.gte or filters.lte)
    fetch_k = min(k * oversample if has_filter else k + (1 if exclude_row is not None else 0),
                  index_obj.n_vectors)

    t0 = time.perf_counter()
    rows, dists = instance.search(query_vec, k=fetch_k)
    t1 = time.perf_counter()

    hits = _postprocess(
        rows=rows,
        dists=dists,
        obs=obs,
        cell_ids=cell_ids,
        filters=filters,
        k=k,
        exclude_row=exclude_row,
    )

    return SearchResponse(
        index_id=index_obj.id,
        dataset_id=dataset.id,
        algorithm=index_obj.algorithm,
        metric=metric,
        k=k,
        n_returned=len(hits),
        latency_ms=(t1 - t0) * 1000.0,
        filter_applied=has_filter,
        hits=hits,
    )


def _postprocess(
    rows: list[int],
    dists: list[float],
    obs: pd.DataFrame,
    cell_ids: np.ndarray,
    filters: SearchFilter | None,
    k: int,
    exclude_row: int | None,
) -> list[SearchHit]:
    hits: list[SearchHit] = []
    rank = 0
    for row, dist in zip(rows, dists, strict=True):
        if exclude_row is not None and row == exclude_row:
            continue
        if filters is not None and not _matches(obs.iloc[row], filters):
            continue
        rank += 1
        hits.append(SearchHit(
            rank=rank,
            cell_id=str(cell_ids[row]),
            row_index=int(row),
            distance=float(dist),
            obs={col: _jsonable(obs.iloc[row][col]) for col in obs.columns},
        ))
        if rank >= k:
            break
    return hits


def _matches(row: pd.Series, filters: SearchFilter) -> bool:
    for col, allowed in filters.equals.items():
        if col not in row.index:
            return False
        if str(row[col]) not in allowed:
            return False
    for col, threshold in filters.gte.items():
        if col not in row.index:
            return False
        try:
            if float(row[col]) < threshold:
                return False
        except (TypeError, ValueError):
            return False
    for col, threshold in filters.lte.items():
        if col not in row.index:
            return False
        try:
            if float(row[col]) > threshold:
                return False
        except (TypeError, ValueError):
            return False
    return True


def _jsonable(v: Any) -> Any:
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return None if math.isnan(f) else f
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if v is None:
        return None
    return v if isinstance(v, (str, int, float, bool)) else str(v)


# ---------- 批量查询 ----------

def search_batch(db: Session, req: BatchSearchRequest) -> BatchSearchResponse:
    """对多个 cell_id 同时检索，结果按 aggregate 策略聚合。"""
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)
    vectors = ds_service.load_vectors(ds)
    obs = ds_service.load_obs(ds)
    cell_ids_arr = ds_service.load_cell_ids(ds)
    instance = idx_service.load_index_instance(idx_obj)

    oversample = _auto_oversample(ds, req.filters, req.k)
    fetch_k = min(req.k * oversample, idx_obj.n_vectors)

    # row_index → (hit_count, total_distance) 累计
    from collections import defaultdict
    accum: dict[int, list[float]] = defaultdict(list)

    t0 = time.perf_counter()
    for cell_id in req.cell_ids:
        try:
            row = ds_service.find_cell_row(ds, cell_id)
        except ValueError:
            continue
        query_vec = _apply_metric(vectors[row], req.metric)
        rows, dists = instance.search(query_vec, k=fetch_k)
        for r, d in zip(rows, dists):
            if r == row:
                continue  # 排除查询自身
            if req.filters and not _matches(obs.iloc[r], req.filters):
                continue
            accum[r].append(d)
    total_ms = (time.perf_counter() - t0) * 1000.0

    # 聚合
    n_queries = len(req.cell_ids)
    if req.aggregate == "intersection":
        candidates = {r: ds for r, ds in accum.items() if len(ds) == n_queries}
    elif req.aggregate == "union":
        candidates = accum
    else:  # ranked
        candidates = accum

    def sort_key(item: tuple[int, list[float]]) -> tuple[int, float]:
        r, ds = item
        return (-len(ds), sum(ds) / len(ds))

    sorted_rows = sorted(candidates.items(), key=sort_key)[: req.k]

    hits: list[BatchHit] = []
    for rank, (r, ds) in enumerate(sorted_rows, start=1):
        cell_row = obs.iloc[r]
        hits.append(BatchHit(
            rank=rank,
            cell_id=str(cell_ids_arr[r]),
            row_index=int(r),
            hit_count=len(ds),
            avg_distance=float(sum(ds) / len(ds)),
            obs={col: _jsonable(cell_row[col]) for col in obs.columns},
        ))

    return BatchSearchResponse(
        index_id=idx_obj.id,
        dataset_id=ds.id,
        algorithm=idx_obj.algorithm,
        metric=req.metric,
        aggregate=req.aggregate,
        n_queries=n_queries,
        k=req.k,
        n_returned=len(hits),
        total_latency_ms=total_ms,
        hits=hits,
    )
