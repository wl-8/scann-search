"""性能评测路由。

POST   /api/benchmark/run              跑一批多算法对比（researcher+）
GET    /api/benchmark/batches          批次列表（?dataset_id= ?label= 过滤）
GET    /api/benchmark/batches/{id}     批次详情，含嵌套结果
DELETE /api/benchmark/batches/{id}     删除批次（级联删结果，researcher+）
GET    /api/benchmark/results/{id}     单条结果详情
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.models import User
from app.benchmark import service
from app.benchmark.schemas import (
    BenchmarkBatchDetail,
    BenchmarkBatchItem,
    BenchmarkResultItem,
    BenchmarkRunRequest,
)
from app.core.dependencies import get_current_user, get_db, require_researcher

router = APIRouter()


@router.post("/run", response_model=BenchmarkBatchDetail, status_code=201)
def run_benchmark(
    req: BenchmarkRunRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> BenchmarkBatchDetail:
    batch = service.run(db, req)
    return BenchmarkBatchDetail.model_validate(batch)


@router.get("/batches", response_model=list[BenchmarkBatchItem])
def list_batches(
    dataset_id: Optional[int] = Query(default=None),
    label: Optional[str] = Query(default=None, description="标签模糊匹配"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[BenchmarkBatchItem]:
    return [BenchmarkBatchItem.model_validate(b) for b in service.list_batches(db, dataset_id, label)]


@router.get("/batches/{batch_id}", response_model=BenchmarkBatchDetail)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> BenchmarkBatchDetail:
    return BenchmarkBatchDetail.model_validate(service.get_batch(db, batch_id))


@router.delete("/batches/{batch_id}", status_code=204)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> None:
    service.delete_batch(db, batch_id)


@router.get("/results/{result_id}", response_model=BenchmarkResultItem)
def get_result(
    result_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> BenchmarkResultItem:
    return BenchmarkResultItem.model_validate(service.get_result(db, result_id))
