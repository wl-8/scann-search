"""检索路由。

POST /api/search/by-cell    给 cell_id，返回相似细胞
POST /api/search/by-vector  给原始向量，返回相似细胞
POST /api/search/batch      给多个 cell_id，聚合检索结果
三个接口都支持 obs 字段过滤和 cosine/l2 距离选择。
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.search import service
from app.search.schemas import (
    BatchSearchRequest,
    BatchSearchResponse,
    SearchByCellRequest,
    SearchByVectorRequest,
    SearchResponse,
)

router = APIRouter()


@router.post("/by-cell", response_model=SearchResponse)
def search_by_cell(req: SearchByCellRequest, db: Session = Depends(get_db)) -> SearchResponse:
    return service.search_by_cell(db, req)


@router.post("/by-vector", response_model=SearchResponse)
def search_by_vector(req: SearchByVectorRequest, db: Session = Depends(get_db)) -> SearchResponse:
    return service.search_by_vector(db, req)


@router.post("/batch", response_model=BatchSearchResponse)
def search_batch(req: BatchSearchRequest, db: Session = Depends(get_db)) -> BatchSearchResponse:
    return service.search_batch(db, req)
