"""索引管理路由。

POST   /api/index/build              构建单数据集索引
POST   /api/index/combined/build     构建严格多数据集联合索引
GET    /api/index/combined           联合索引列表
GET    /api/index/combined/{id}      联合索引详情
DELETE /api/index/combined/{id}      删除联合索引
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
from app.auth.models import User
from app.core.dependencies import get_current_user, get_db, require_researcher
from app.index import service
from app.index.schemas import CombinedIndexBuildRequest, CombinedIndexResponse, IndexBuildRequest, IndexResponse

router = APIRouter()


@router.get("/algorithms", response_model=list[str])
def list_algorithms(_: User = Depends(get_current_user)) -> list[str]:
    return list(SUPPORTED_ALGORITHMS)


@router.post("/build", response_model=IndexResponse)
def build_index(req: IndexBuildRequest, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> IndexResponse:
    obj = service.build(db, req)
    return IndexResponse.model_validate(obj)


@router.post("/combined/build", response_model=CombinedIndexResponse)
def build_combined_index(
    req: CombinedIndexBuildRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> CombinedIndexResponse:
    obj = service.build_combined(db, req)
    return CombinedIndexResponse.model_validate(obj)


@router.get("/combined", response_model=list[CombinedIndexResponse])
def list_combined_indexes(
    dataset_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[CombinedIndexResponse]:
    return [CombinedIndexResponse.model_validate(x) for x in service.list_combined(db, dataset_id)]


@router.get("/combined/{combined_index_id}", response_model=CombinedIndexResponse)
def get_combined_index(
    combined_index_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CombinedIndexResponse:
    return CombinedIndexResponse.model_validate(service.get_combined_by_id(db, combined_index_id))


@router.delete("/combined/{combined_index_id}", status_code=204)
def delete_combined_index(
    combined_index_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> None:
    service.delete_combined(db, combined_index_id)


@router.get("", response_model=list[IndexResponse])
def list_indexes(
    dataset_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[IndexResponse]:
    return [IndexResponse.model_validate(x) for x in service.list_all(db, dataset_id)]


@router.get("/{index_id}", response_model=IndexResponse)
def get_index(index_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> IndexResponse:
    return IndexResponse.model_validate(service.get_by_id(db, index_id))


@router.delete("/{index_id}", status_code=204)
def delete_index(index_id: int, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> None:
    service.delete(db, index_id)
