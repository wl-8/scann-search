"""检索业务逻辑：top-k + 条件过滤。

过滤策略采用 **post-filter**：先用 ANN 召回 k*oversample 个候选，再按 obs 等值过滤截到 k。
工程上简单稳定；在选择度高（大多数细胞符合条件）时 recall 接近无过滤。
低选择度场景下 oversample 调大；后续可加 pre-filter / hybrid 作为算法改进加分点。
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

    query_vec = vectors[row]
    return _execute_search(
        db=db,
        index_obj=idx_obj,
        dataset=ds,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        oversample=req.oversample,
        exclude_row=row,  # 查询自身在结果里没意义，剔除
    )


def search_by_vector(db: Session, req: SearchByVectorRequest) -> SearchResponse:
    idx_obj = idx_service.get_ready(db, req.index_id)
    ds = ds_service.get_ready(db, idx_obj.dataset_id)

    query_vec = np.asarray(req.vector, dtype=np.float32)
    if query_vec.shape[0] != ds.vector_dim:
        raise InvalidQueryVector(query_vec.shape[0], ds.vector_dim)

    return _execute_search(
        db=db,
        index_obj=idx_obj,
        dataset=ds,
        query_vec=query_vec,
        k=req.k,
        filters=req.filters,
        oversample=req.oversample,
    )


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
