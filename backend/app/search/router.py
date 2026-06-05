"""检索路由。

POST /api/search/by-cell             给 cell_id，返回相似细胞
POST /api/search/by-vector           给原始向量，返回相似细胞
POST /api/search/batch               给多个 cell_id，聚合检索结果
POST /api/search/multi-dataset       跨多个索引/数据集联合检索
POST /api/search/combined-index      在一个严格联合大索引上检索
POST /api/search/compare-strategies  对同一查询跑 post/pre/hybrid 三种过滤策略并对比
前 3 个接口都支持 obs 字段过滤和 cosine/l2 距离选择。
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.dependencies import get_current_user, get_db
from app.search import service
from app.search.schemas import (
    BatchSearchRequest,
    BatchSearchResponse,
    CombinedIndexSearchRequest,
    CombinedIndexSearchResponse,
    CompareStrategiesRequest,
    CompareStrategiesResponse,
    MultiDatasetSearchRequest,
    MultiDatasetSearchResponse,
    SearchByCellRequest,
    SearchByVectorRequest,
    SearchResponse,
)

router = APIRouter()


@router.post("/by-cell", response_model=SearchResponse)
def search_by_cell(
    req: SearchByCellRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
    return service.search_by_cell(db, req, cache_for=current_user.id)


@router.post("/by-vector", response_model=SearchResponse)
def search_by_vector(
    req: SearchByVectorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
    return service.search_by_vector(db, req, cache_for=current_user.id)


@router.post("/batch", response_model=BatchSearchResponse)
def search_batch(
    req: BatchSearchRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> BatchSearchResponse:
    return service.search_batch(db, req)


@router.post("/multi-dataset", response_model=MultiDatasetSearchResponse)
def search_multi_dataset(
    req: MultiDatasetSearchRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MultiDatasetSearchResponse:
    return service.search_multi_dataset(db, req)


@router.post("/combined-index", response_model=CombinedIndexSearchResponse)
def search_combined_index(
    req: CombinedIndexSearchRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CombinedIndexSearchResponse:
    return service.search_combined_index(db, req)


@router.post("/compare-strategies", response_model=CompareStrategiesResponse)
def compare_strategies(
    req: CompareStrategiesRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CompareStrategiesResponse:
    """跑 post/pre/hybrid 三种过滤策略并返回 recall × latency × n_returned 对比。

    用例：低选择度查询（罕见 cell_type）下，post 通常返回不足 k 个，
    pre 永远精确，hybrid 在 HNSW 上是性能折中。
    """
    return service.compare_strategies(db, req)
