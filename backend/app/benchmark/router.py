"""性能评测路由。

POST /api/benchmark/run                  跑一批多算法对比
GET  /api/benchmark/runs                 所有评测记录（可按 dataset_id 过滤）
GET  /api/benchmark/runs/{id}            某条记录详情
GET  /api/benchmark/batches/{batch_id}   某一批跑批的所有结果
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.models import User
from app.benchmark import service
from app.benchmark.schemas import (
    BenchmarkResultItem,
    BenchmarkRunRequest,
    BenchmarkRunResponse,
)
from app.core.dependencies import get_db, require_researcher

router = APIRouter()


@router.post("/run", response_model=BenchmarkRunResponse)
def run_benchmark(req: BenchmarkRunRequest, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> BenchmarkRunResponse:
    rows = service.run(db, req)
    items = [BenchmarkResultItem.model_validate(r) for r in rows]
    return BenchmarkRunResponse(
        batch_id=rows[0].batch_id,
        dataset_id=req.dataset_id,
        k=req.k,
        n_queries=req.n_queries,
        results=items,
    )


@router.get("/runs", response_model=list[BenchmarkResultItem])
def list_runs(
    dataset_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> list[BenchmarkResultItem]:
    return [BenchmarkResultItem.model_validate(x) for x in service.list_all(db, dataset_id)]


@router.get("/runs/{run_id}", response_model=BenchmarkResultItem)
def get_run(run_id: int, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> BenchmarkResultItem:
    return BenchmarkResultItem.model_validate(service.get_by_id(db, run_id))


@router.get("/batches/{batch_id}", response_model=list[BenchmarkResultItem])
def get_batch(batch_id: str, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> list[BenchmarkResultItem]:
    return [BenchmarkResultItem.model_validate(x) for x in service.list_batch(db, batch_id)]
