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

from app.ann.hnsw import HNSWIndex
from app.ann.metrics import l2_normalize
from app.core import filters as obs_filters
from app.datasets import service as ds_service
from app.index import service as idx_service
from app.search import strategies as strat
from app.search.exceptions import CellNotFound, InvalidQueryVector
from app.search.schemas import (
    BatchHit,
    BatchSearchRequest,
    BatchSearchResponse,
    CombinedIndexHit,
    CombinedIndexSearchRequest,
    CombinedIndexSearchResponse,
    CompareStrategiesRequest,
    CompareStrategiesResponse,
    MultiDatasetHit,
    MultiDatasetSearchRequest,
    MultiDatasetSearchResponse,
    SearchByCellRequest,
    SearchByVectorRequest,
    SearchFilter,
    SearchHit,
    SearchResponse,
    SkippedIndex,
    StrategyResult,
)


def search_by_cell(db: Session, req: SearchByCellRequest, *, cache_for: int | None = None) -> SearchResponse:
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)
    vectors = ds_service.load_vectors(ds)
    metric = _index_metric(idx_obj)

    try:
        row = ds_service.find_cell_row(ds, req.cell_id)
    except ValueError as e:
        raise CellNotFound(req.cell_id, ds.id) from e

    query_vec = _apply_metric(vectors[row], metric)
    oversample = req.oversample or _auto_oversample(ds, req.filters, req.k)
    result = _execute_search(
        db=db,
        index_obj=idx_obj,
        dataset=ds,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        oversample=oversample,
        exclude_row=row,
        metric=metric,
    )
    if cache_for is not None:
        from app.export.cache import search_cache
        search_cache[cache_for] = result
    return result


def search_by_vector(db: Session, req: SearchByVectorRequest, *, cache_for: int | None = None) -> SearchResponse:
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)
    metric = _index_metric(idx_obj)

    query_vec = np.asarray(req.vector, dtype=np.float32)
    if query_vec.shape[0] != ds.vector_dim:
        raise InvalidQueryVector(query_vec.shape[0], ds.vector_dim)

    query_vec = _apply_metric(query_vec, metric)
    oversample = req.oversample or _auto_oversample(ds, req.filters, req.k)
    result = _execute_search(
        db=db,
        index_obj=idx_obj,
        dataset=ds,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        oversample=oversample,
        metric=metric,
    )
    if cache_for is not None:
        from app.export.cache import search_cache
        search_cache[cache_for] = result
    return result


# ---------- 自适应 oversample ----------

def _auto_oversample(ds, filters: SearchFilter | None, k: int) -> int:
    """根据过滤条件在数据集中的选择率估算 oversample。

    选择率由统一 FilterPlan 计算，覆盖 equals/gte/lte。
    估算结果保守偏大，上限 500，下限 2。
    """
    if not obs_filters.has_filters(filters):
        return 2  # 无过滤条件，稍微多取一点用于剔除查询自身

    plan = obs_filters.build_filter_plan(ds_service.load_obs(ds), filters)
    selectivity = plan.selectivity

    selectivity = max(selectivity, 0.005)  # 防止极端稀疏条件导致 oversample 爆炸
    needed = math.ceil(1.0 / selectivity)  # 期望命中 k 个有效 hit 需要多取 1/selectivity 倍
    return min(max(needed, 2), 500)


def _apply_metric(vec: np.ndarray, metric: str) -> np.ndarray:
    """cosine 模式下对查询向量做 L2 归一化，使索引的 L2 距离等价于余弦距离。"""
    if metric == "cosine":
        return l2_normalize(vec)
    return vec


def _index_metric(index_obj) -> str:
    metric = str((getattr(index_obj, "params", None) or {}).get("metric", "l2")).lower()
    return "cosine" if metric == "cosine" else "l2"


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

    has_filter = obs_filters.has_filters(filters)
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
    for row, dist in zip(rows, dists):
        if exclude_row is not None and row == exclude_row:
            continue
        if not obs_filters.matches_row(obs.iloc[row], filters):
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
    metric = _index_metric(idx_obj)

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
        query_vec = _apply_metric(vectors[row], metric)
        rows, dists = instance.search(query_vec, k=fetch_k)
        for r, d in zip(rows, dists):
            if r == row:
                continue  # 排除查询自身
            if not obs_filters.matches_row(obs.iloc[r], req.filters):
                continue
            accum[r].append(d)
    total_ms = (time.perf_counter() - t0) * 1000.0

    # 聚合
    n_queries = len(req.cell_ids)
    if req.aggregate == "intersection":
        candidates = {r: ds for r, ds in accum.items() if len(ds) == n_queries}
        sort_key = lambda item: sum(item[1]) / len(item[1])  # noqa: E731
    elif req.aggregate == "union":
        candidates = accum
        sort_key = lambda item: sum(item[1]) / len(item[1])  # noqa: E731
    else:  # ranked: hit_count desc, then avg_dist asc
        candidates = accum
        sort_key = lambda item: (-len(item[1]), sum(item[1]) / len(item[1]))  # noqa: E731

    sorted_rows = sorted(candidates.items(), key=sort_key)[: req.k]

    hits: list[BatchHit] = []
    for rank, (r, row_dists) in enumerate(sorted_rows, start=1):
        cell_row = obs.iloc[r]
        hits.append(BatchHit(
            rank=rank,
            cell_id=str(cell_ids_arr[r]),
            row_index=int(r),
            hit_count=len(row_dists),
            avg_distance=float(sum(row_dists) / len(row_dists)),
            obs={col: _jsonable(cell_row[col]) for col in obs.columns},
        ))

    return BatchSearchResponse(
        index_id=idx_obj.id,
        dataset_id=idx_obj.dataset_id,
        algorithm=idx_obj.algorithm,
        metric=metric,
        aggregate=req.aggregate,
        n_queries=n_queries,
        k=req.k,
        n_returned=len(hits),
        total_latency_ms=total_ms,
        hits=hits,
    )


# ---------- 多数据集查询 ----------

def search_multi_dataset(db: Session, req: MultiDatasetSearchRequest) -> MultiDatasetSearchResponse:
    """Run one query against multiple target indexes and globally merge hits."""
    idx_objs = [idx_service.get_ready(db, index_id) for index_id in req.index_ids]
    datasets = {idx.dataset_id: ds_service.get_ready(db, idx.dataset_id) for idx in idx_objs}

    query_vec, source_dataset_id, source_row = _resolve_multi_dataset_query(db, req, idx_objs, datasets)
    response_metrics = sorted({_index_metric(idx_obj) for idx_obj in idx_objs})

    skipped: list[SkippedIndex] = []
    candidates: list[MultiDatasetHit] = []
    has_filter = obs_filters.has_filters(req.filters)

    t0 = time.perf_counter()
    for idx_obj in idx_objs:
        ds = datasets[idx_obj.dataset_id]
        if ds.vector_dim != int(query_vec.shape[0]):
            skipped.append(SkippedIndex(
                index_id=idx_obj.id,
                dataset_id=ds.id,
                reason=f"查询向量维度 {query_vec.shape[0]} 与数据集向量维度 {ds.vector_dim} 不一致",
            ))
            continue

        metric = _index_metric(idx_obj)
        target_query_vec = _apply_metric(query_vec, metric)
        oversample = req.oversample or _auto_oversample(ds, req.filters, req.k)
        exclude_row = source_row if ds.id == source_dataset_id else None
        result = _execute_search(
            db=db,
            index_obj=idx_obj,
            dataset=ds,
            query_vec=target_query_vec,
            k=req.k,
            filters=req.filters,
            oversample=oversample,
            exclude_row=exclude_row,
            metric=metric,
        )
        for hit in result.hits:
            candidates.append(MultiDatasetHit(
                **hit.model_dump(),
                index_id=idx_obj.id,
                dataset_id=ds.id,
                algorithm=idx_obj.algorithm,
            ))

    candidates.sort(key=lambda hit: hit.distance)
    hits: list[MultiDatasetHit] = []
    for rank, hit in enumerate(candidates[: req.k], start=1):
        data = hit.model_dump()
        data["rank"] = rank
        hits.append(MultiDatasetHit(**data))
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    return MultiDatasetSearchResponse(
        index_ids=[idx.id for idx in idx_objs],
        dataset_ids=[idx.dataset_id for idx in idx_objs],
        metric=response_metrics[0] if len(response_metrics) == 1 else "mixed",
        k=req.k,
        n_returned=len(hits),
        total_latency_ms=elapsed_ms,
        filter_applied=has_filter,
        hits=hits,
        skipped=skipped,
    )


def _resolve_multi_dataset_query(
    db: Session,
    req: MultiDatasetSearchRequest,
    idx_objs,
    datasets,
) -> tuple[np.ndarray, int | None, int | None]:
    if req.vector is not None:
        return np.asarray(req.vector, dtype=np.float32), None, None

    assert req.cell_id is not None
    candidate_indexes = idx_objs
    if req.source_index_id is not None:
        candidate_indexes = [idx_service.get_ready(db, req.source_index_id)]

    for idx_obj in candidate_indexes:
        ds = datasets.get(idx_obj.dataset_id) or ds_service.get_ready(db, idx_obj.dataset_id)
        vectors = ds_service.load_vectors(ds)
        try:
            row = ds_service.find_cell_row(ds, req.cell_id)
        except ValueError:
            continue
        return vectors[row], ds.id, row

    raise CellNotFound(req.cell_id, candidate_indexes[0].dataset_id if candidate_indexes else 0)


# ---------- 严格联合索引查询 ----------

def search_combined_index(db: Session, req: CombinedIndexSearchRequest) -> CombinedIndexSearchResponse:
    """Run a query against one physical combined index."""
    combined = idx_service.get_combined_ready(db, req.combined_index_id)
    mapping = idx_service.load_combined_mapping(combined)
    dataset_ids = [int(item) for item in (combined.dataset_ids or [])]
    datasets = {dataset_id: ds_service.get_ready(db, dataset_id) for dataset_id in dataset_ids}

    query_vec, source_dataset_id, source_row = _resolve_combined_query(req, combined, datasets)
    if query_vec.shape[0] != combined.vector_dim:
        raise InvalidQueryVector(int(query_vec.shape[0]), combined.vector_dim)
    query_vec = _apply_metric(query_vec, req.metric)

    instance = idx_service.load_combined_index_instance(combined)
    has_filter = obs_filters.has_filters(req.filters)
    oversample = req.oversample or (10 if has_filter else 2)
    fetch_k = min(req.k * oversample if has_filter else req.k + (1 if source_row is not None else 0), combined.n_vectors)

    t0 = time.perf_counter()
    rows, dists = instance.search(query_vec, k=fetch_k)
    latency_ms = (time.perf_counter() - t0) * 1000.0

    obs_by_dataset: dict[int, pd.DataFrame] = {}
    hits: list[CombinedIndexHit] = []
    rank = 0
    for global_row, dist in zip(rows, dists):
        global_row_int = int(global_row)
        dataset_id = int(mapping["dataset_ids"][global_row_int])
        row_index = int(mapping["row_indices"][global_row_int])
        cell_id = str(mapping["cell_ids"][global_row_int])

        if source_dataset_id == dataset_id and source_row == row_index:
            continue
        if dataset_id not in obs_by_dataset:
            obs_by_dataset[dataset_id] = ds_service.load_obs(datasets[dataset_id])
        obs = obs_by_dataset[dataset_id]
        cell_row = obs.iloc[row_index]
        if not obs_filters.matches_row(cell_row, req.filters):
            continue

        rank += 1
        hits.append(CombinedIndexHit(
            rank=rank,
            cell_id=cell_id,
            row_index=row_index,
            global_row_index=global_row_int,
            distance=float(dist),
            obs={col: _jsonable(cell_row[col]) for col in obs.columns},
            combined_index_id=combined.id,
            dataset_id=dataset_id,
            algorithm=combined.algorithm,
        ))
        if rank >= req.k:
            break

    return CombinedIndexSearchResponse(
        combined_index_id=combined.id,
        dataset_ids=dataset_ids,
        algorithm=combined.algorithm,
        metric=req.metric,
        k=req.k,
        n_returned=len(hits),
        latency_ms=latency_ms,
        filter_applied=has_filter,
        hits=hits,
    )


def _resolve_combined_query(
    req: CombinedIndexSearchRequest,
    combined,
    datasets: dict[int, object],
) -> tuple[np.ndarray, int | None, int | None]:
    if req.vector is not None:
        return np.asarray(req.vector, dtype=np.float32), None, None

    assert req.cell_id is not None
    candidate_dataset_ids = [req.source_dataset_id] if req.source_dataset_id is not None else list(combined.dataset_ids or [])
    for dataset_id in candidate_dataset_ids:
        if dataset_id not in datasets:
            continue
        ds = datasets[int(dataset_id)]
        vectors = ds_service.load_vectors(ds)
        try:
            row = ds_service.find_cell_row(ds, req.cell_id)
        except ValueError:
            continue
        return vectors[row], int(dataset_id), row

    fallback_dataset_id = int(candidate_dataset_ids[0] or 0) if candidate_dataset_ids else 0
    raise CellNotFound(req.cell_id, fallback_dataset_id)


# ---------- 过滤策略对比 ----------

def compare_strategies(db: Session, req: CompareStrategiesRequest) -> CompareStrategiesResponse:
    """在同一查询上跑三种过滤策略并返回对比结果。

    Ground truth = pre-filter 的结果（在过滤后的子集上做精确暴力检索）。
    其它策略的 recall@k 是相对 pre 的 hit 集合算的。
    """
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)
    vectors = ds_service.load_vectors(ds)
    obs = ds_service.load_obs(ds)
    cell_ids = ds_service.load_cell_ids(ds)
    instance = idx_service.load_index_instance(idx_obj)
    metric = _index_metric(idx_obj)

    # 解析查询向量 + 排除自身行
    exclude_row: int | None = None
    if req.cell_id:
        try:
            exclude_row = ds_service.find_cell_row(ds, req.cell_id)
        except ValueError as e:
            raise CellNotFound(req.cell_id, ds.id) from e
        query_vec = vectors[exclude_row]
    else:
        query_vec = np.asarray(req.vector, dtype=np.float32)
        if query_vec.shape[0] != ds.vector_dim:
            raise InvalidQueryVector(query_vec.shape[0], ds.vector_dim)
    query_vec = _apply_metric(query_vec, metric)
    strategy_vectors = l2_normalize(vectors) if metric == "cosine" else vectors

    # 选择度（决定后面 post 策略会不会"召回不足"）
    n_total = int(vectors.shape[0])
    filter_plan = obs_filters.build_filter_plan(obs, req.filters)
    if exclude_row is not None:
        allowed_count = int((filter_plan.allowed_rows != exclude_row).sum())
    else:
        allowed_count = filter_plan.n_matching
    selectivity = allowed_count / n_total if n_total > 0 else 0.0

    # 跑 pre 先得到 ground truth（不算在它自己的 recall 里，永远是 1.0）
    pre_out = strat.pre_filter_search(
        vectors=strategy_vectors,
        obs=obs,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        exclude_row=exclude_row,
    )
    ground_truth_set = set(pre_out.rows)

    # 依次跑用户要求的策略
    outputs: dict[str, strat.StrategyOutput] = {}
    for name in req.strategies:
        if name == "pre":
            outputs["pre"] = pre_out
        elif name == "post":
            outputs["post"] = strat.post_filter_search(
                ann_index=instance,
                query_vec=query_vec,
                k=req.k,
                filters=req.filters,
                obs=obs,
                n_total=n_total,
                oversample=req.oversample,
                exclude_row=exclude_row,
            )
        elif name == "hybrid":
            if not isinstance(instance, HNSWIndex):
                # 非 HNSW 算法跳过，给个占位结果便于前端展示"不支持"
                outputs["hybrid"] = strat.StrategyOutput(
                    rows=[], distances=[], latency_ms=0.0,
                    extra={"skipped_reason": f"hybrid 仅支持 HNSW，当前 {idx_obj.algorithm}"},
                )
            else:
                outputs["hybrid"] = strat.hybrid_hnsw_search(
                    ann_index=instance,
                    obs=obs,
                    query_vec=query_vec,
                    k=req.k,
                    filters=req.filters,
                    n_total=n_total,
                    exclude_row=exclude_row,
                )

    # 组装响应
    results = [
        _to_strategy_result(name, outputs[name], req.k, obs, cell_ids, ground_truth_set)
        for name in req.strategies
        if name in outputs
    ]
    return CompareStrategiesResponse(
        index_id=idx_obj.id,
        dataset_id=ds.id,
        algorithm=idx_obj.algorithm,
        metric=metric,
        k=req.k,
        n_total_cells=n_total,
        n_matching_filter=allowed_count,
        filter_selectivity=selectivity,
        results=results,
    )


def _to_strategy_result(
    name: str,
    out: "strat.StrategyOutput",
    k: int,
    obs: pd.DataFrame,
    cell_ids: np.ndarray,
    ground_truth: set[int],
) -> StrategyResult:
    hits: list[SearchHit] = []
    for rank, (row, dist) in enumerate(zip(out.rows, out.distances), start=1):
        hits.append(SearchHit(
            rank=rank,
            cell_id=str(cell_ids[row]),
            row_index=int(row),
            distance=float(dist),
            obs={col: _jsonable(obs.iloc[row][col]) for col in obs.columns},
        ))

    if name == "pre":
        recall = 1.0 if hits else 0.0
    elif not ground_truth:
        recall = 0.0
    else:
        recall = len(set(out.rows) & ground_truth) / len(ground_truth)

    return StrategyResult(
        strategy=name,
        n_returned=len(hits),
        requested_k=k,
        latency_ms=out.latency_ms,
        recall_at_k=recall,
        extra=out.extra,
        hits=hits,
    )
