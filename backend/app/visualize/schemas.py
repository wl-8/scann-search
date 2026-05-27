"""可视化模块 Pydantic schema。"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------- 散点图数据 ----------

class EmbeddingPoint(BaseModel):
    """散点图中的一个细胞点。"""
    cell_id: str
    x: float
    y: float
    z: float | None = None        # 仅 3D 模式返回
    label: str                    # color_by 字段的值，用于着色
    obs: dict[str, Any]           # 完整 obs，用于 hover tooltip


class EmbeddingResponse(BaseModel):
    dataset_id: int
    embedding_key: str            # 当前激活的 obsm key，如 X_pca / X_umap
    mode: Literal["2d", "3d"]
    color_by: str                 # 本次着色所用的 obs 字段
    color_options: list[str]      # 所有可用于着色的 obs 字段
    n_total: int                  # 数据集总细胞数
    n_returned: int               # 本次返回的点数（降采样后）
    points: list[EmbeddingPoint]


# ---------- 高亮定位 ----------

class LocateRequest(BaseModel):
    """给一批 cell_id，返回它们在当前 embedding 空间中的坐标（用于高亮显示）。"""
    cell_ids: list[str] = Field(min_length=1, max_length=5000)
    mode: Literal["2d", "3d"] = "2d"


class LocatePoint(BaseModel):
    cell_id: str
    x: float
    y: float
    z: float | None = None
    row_index: int


class LocateResponse(BaseModel):
    dataset_id: int
    mode: str
    points: list[LocatePoint]


# ---------- 可用模式 ----------

class ModesResponse(BaseModel):
    dataset_id: int
    embedding_key: str
    vector_dim: int
    available_modes: list[str]    # ["2d"] 或 ["2d", "3d"]
    color_options: list[str]
