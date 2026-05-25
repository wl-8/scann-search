"""检索模块 Pydantic schema。"""
from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.search.constants import DEFAULT_K, MAX_K


class SearchFilter(BaseModel):
    """obs 字段过滤，支持等值和数值范围，列之间 AND。

    equals: 字符串等值，列内多值 OR。
      Example: {"cell_type": ["Hepatocyte", "Kupffer"], "disease": ["normal"]}
    gte: 数值下界（>=）。Example: {"n_counts": 500}
    lte: 数值上界（<=）。Example: {"pct_counts_mt": 20}
    """
    equals: dict[str, list[str]] = Field(default_factory=dict)
    gte: dict[str, float] = Field(default_factory=dict)
    lte: dict[str, float] = Field(default_factory=dict)


class SearchByCellRequest(BaseModel):
    index_id: int
    cell_id: str
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter | None = None
    # 过滤模式：post=召回 k*oversample 后过滤；不指定则按系统默认 post
    oversample: int = Field(default=10, ge=1, le=100, description="post-filter 时多召回的倍数")


class SearchByVectorRequest(BaseModel):
    index_id: int
    vector: list[float]
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter | None = None
    oversample: int = Field(default=10, ge=1, le=100)

    @model_validator(mode="after")
    def _check_vector(self) -> "SearchByVectorRequest":
        if not self.vector:
            raise ValueError("vector 不能为空")
        return self


class SearchHit(BaseModel):
    rank: int
    cell_id: str
    row_index: int
    distance: float
    obs: dict[str, Any]


class SearchResponse(BaseModel):
    index_id: int
    dataset_id: int
    algorithm: str
    k: int
    n_returned: int
    latency_ms: float
    filter_applied: bool
    hits: list[SearchHit]
