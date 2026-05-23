"""索引模块 Pydantic schema。"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class IndexBuildRequest(BaseModel):
    dataset_id: int
    algorithm: str = Field(description="参见 app.index.constants（flat / hnsw / ...）")
    params: dict[str, Any] = Field(default_factory=dict, description="算法专属参数")


class IndexResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    algorithm: str
    params: dict[str, Any]
    file_path: str
    status: str
    error_msg: str
    build_time_ms: float
    index_size_bytes: int
    n_vectors: int
    vector_dim: int
    created_at: datetime
