"""索引管理路由。

POST   /api/index/build              构建索引
GET    /api/index                    所有索引列表（可按 dataset_id 过滤）
GET    /api/index/{id}               详情
DELETE /api/index/{id}               删除
GET    /api/index/algorithms         支持的算法列表
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.ann.factory import SUPPORTED_ALGORITHMS
from app.core.dependencies import get_db
from app.index import service
from app.index.schemas import IndexBuildRequest, IndexResponse

router = APIRouter()


@router.get("/algorithms", response_model=list[str])
def list_algorithms() -> list[str]:
    return list(SUPPORTED_ALGORITHMS)


@router.post("/build", response_model=IndexResponse)
def build_index(req: IndexBuildRequest, db: Session = Depends(get_db)) -> IndexResponse:
    obj = service.build(db, req)
    return IndexResponse.model_validate(obj)


@router.get("", response_model=list[IndexResponse])
def list_indexes(
    dataset_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
) -> list[IndexResponse]:
    return [IndexResponse.model_validate(x) for x in service.list_all(db, dataset_id)]


@router.get("/{index_id}", response_model=IndexResponse)
def get_index(index_id: int, db: Session = Depends(get_db)) -> IndexResponse:
    return IndexResponse.model_validate(service.get_by_id(db, index_id))


@router.delete("/{index_id}", status_code=204)
def delete_index(index_id: int, db: Session = Depends(get_db)) -> None:
    service.delete(db, index_id)
