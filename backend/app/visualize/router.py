"""可视化路由。

GET  /api/visualize/{dataset_id}/modes       可用模式与着色字段
GET  /api/visualize/{dataset_id}/embedding   散点图数据（支持 2D / 3D，降采样）
POST /api/visualize/{dataset_id}/locate      给 cell_id 列表返回坐标（用于高亮）
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.dependencies import get_current_user, get_db
from app.visualize import service
from app.visualize.schemas import (
    EmbeddingResponse,
    LocateRequest,
    LocateResponse,
    ModesResponse,
)

router = APIRouter()


@router.get("/{dataset_id}/modes", response_model=ModesResponse)
def get_modes(
    dataset_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ModesResponse:
    return service.get_modes(db, dataset_id)


@router.get("/{dataset_id}/embedding", response_model=EmbeddingResponse)
def get_embedding(
    dataset_id: int,
    mode: str = Query(default="2d", description="2d 或 3d"),
    color_by: str = Query(default="cell_type", description="用于着色的 obs 字段名"),
    max_points: int = Query(default=50_000, ge=100, le=200_000, description="返回点数上限，超出时分层降采样"),
    embedding_key: str | None = Query(default=None, description="可选 obsm key，如 X_umap；为空则使用当前检索 embedding"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> EmbeddingResponse:
    return service.get_embedding(db, dataset_id, mode, color_by, max_points, embedding_key)


@router.post("/{dataset_id}/locate", response_model=LocateResponse)
def locate_cells(
    dataset_id: int,
    req: LocateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> LocateResponse:
    return service.locate_cells(db, dataset_id, req.cell_ids, req.mode)
