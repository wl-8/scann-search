"""数据集模块 Pydantic schema。"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DatasetRegisterRequest(BaseModel):
    """注册一个已经存在于文件系统上的 .h5ad（不通过 multipart 上传）。"""
    name: str = Field(min_length=1, max_length=128)
    source_path: str = Field(description=".h5ad 的绝对路径或相对工作目录的路径")
    description: str = ""
    embedding_key: str = Field(default="X_pca", description="adata.obsm 中用作向量的键")


class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    source_path: str
    n_cells: int
    n_genes: int
    vector_dim: int
    embedding_key: str
    status: str
    error_msg: str
    created_at: datetime


class DatasetStatsResponse(BaseModel):
    """obs 字段的取值分布（用于前端筛选器）。"""
    dataset_id: int
    obs_columns: list[str]
    value_counts: dict[str, dict[str, int]]  # column -> {value: count}


class CellResponse(BaseModel):
    """分页细胞列表中的一行。"""
    cell_id: str
    row_index: int
    obs: dict[str, Any]


class CellPageResponse(BaseModel):
    dataset_id: int
    total: int
    offset: int
    limit: int
    items: list[CellResponse]
