"""数据集管理路由。

POST /api/datasets/register         注册已存在的 .h5ad
GET  /api/datasets                  列表
GET  /api/datasets/{id}             详情
DELETE /api/datasets/{id}           删除（同步删工件，索引由 index 模块级联）
GET  /api/datasets/{id}/stats       obs 字段取值分布
GET  /api/datasets/{id}/cells       分页细胞列表
"""
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.datasets import service
from app.datasets.schemas import (
    CellPageResponse,
    CellResponse,
    DatasetRegisterRequest,
    DatasetResponse,
    DatasetStatsResponse,
)

router = APIRouter()


@router.post("/register", response_model=DatasetResponse)
def register_dataset(req: DatasetRegisterRequest, db: Session = Depends(get_db)) -> DatasetResponse:
    ds = service.register(db, req)
    return DatasetResponse.model_validate(ds)


@router.get("", response_model=list[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)) -> list[DatasetResponse]:
    return [DatasetResponse.model_validate(d) for d in service.list_all(db)]


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)) -> DatasetResponse:
    return DatasetResponse.model_validate(service.get_by_id(db, dataset_id))


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)) -> None:
    service.delete(db, dataset_id)


@router.get("/{dataset_id}/stats", response_model=DatasetStatsResponse)
def dataset_stats(dataset_id: int, db: Session = Depends(get_db)) -> DatasetStatsResponse:
    ds = service.get_ready(db, dataset_id)
    counts = service.value_counts(ds)
    return DatasetStatsResponse(
        dataset_id=ds.id,
        obs_columns=list(counts.keys()),
        value_counts=counts,
    )


@router.get("/{dataset_id}/cells", response_model=CellPageResponse)
def list_cells(
    dataset_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> CellPageResponse:
    ds = service.get_ready(db, dataset_id)
    obs = service.load_obs(ds)
    cell_ids = service.load_cell_ids(ds)
    total = int(len(obs))

    end = min(offset + limit, total)
    items: list[CellResponse] = []
    for i in range(offset, end):
        row: dict[str, Any] = {
            col: _to_jsonable(obs.iloc[i][col]) for col in obs.columns
        }
        items.append(CellResponse(cell_id=str(cell_ids[i]), row_index=i, obs=row))

    return CellPageResponse(
        dataset_id=ds.id, total=total, offset=offset, limit=limit, items=items,
    )


def _to_jsonable(v: Any) -> Any:
    # pandas/numpy → 纯 Python，便于 JSON 序列化
    import math

    import numpy as np
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
