"""索引模块 Pydantic schema。"""
from datetime import datetime
from typing import Any, Literal

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class IndexBuildRequest(BaseModel):
    dataset_id: int
    algorithm: str = Field(description="参见 app.index.constants（flat / hnsw / ...）")
    params: dict[str, Any] = Field(default_factory=dict, description="算法专属参数")
    metric: Literal["l2", "cosine"] = Field(
        default="l2",
        description=(
            "距离度量，构建时即固定：l2=欧氏距离；"
            "cosine=余弦（构建时对库向量做 L2 归一化，检索时查询同样归一化）。"
            "检索接口的 metric 字段不再覆盖此项。"
        ),
    )


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


class CombinedIndexBuildRequest(BaseModel):
    name: str = Field(default="", max_length=128)
    description: str = ""
    dataset_ids: Annotated[list[int], Field(min_length=2, max_length=20)]
    algorithm: str = Field(description="参见 app.index.constants（flat / hnsw / ...）")
    params: dict[str, Any] = Field(default_factory=dict, description="算法专属参数")


class CombinedIndexResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    dataset_ids: list[int]
    algorithm: str
    params: dict[str, Any]
    file_path: str
    mapping_path: str
    status: str
    error_msg: str
    build_time_ms: float
    index_size_bytes: int
    n_vectors: int
    vector_dim: int
    created_at: datetime
