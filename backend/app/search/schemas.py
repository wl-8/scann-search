"""检索模块 Pydantic schema。"""
from typing import Annotated, Any, Literal

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
    oversample: int | None = Field(
        default=None,
        ge=1,
        le=500,
        description="post-filter 多召回倍数；None 时根据过滤条件选择率自动推断",
    )
    metric: Literal["l2", "cosine"] = Field(
        default="l2",
        description="距离度量：l2=欧氏距离，cosine=余弦距离（查询前对向量做 L2 归一化）",
    )


class SearchByVectorRequest(BaseModel):
    index_id: int
    vector: list[float]
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter | None = None
    oversample: int | None = Field(default=None, ge=1, le=500)
    metric: Literal["l2", "cosine"] = Field(default="l2")

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
    metric: str
    k: int
    n_returned: int
    latency_ms: float
    filter_applied: bool
    hits: list[SearchHit]


# ---------- 批量查询 ----------

class BatchSearchRequest(BaseModel):
    """对多个 cell_id 同时检索，结果按指定策略聚合。

    aggregate:
      ranked      — 按命中频次降序排列，同频次按平均距离升序（默认）
      union       — 任一查询命中即保留，去重
      intersection — 所有查询都命中才保留
    """
    index_id: int
    cell_ids: Annotated[list[str], Field(min_length=1, max_length=50)]
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter | None = None
    metric: Literal["l2", "cosine"] = "l2"
    aggregate: Literal["ranked", "union", "intersection"] = "ranked"


class BatchHit(BaseModel):
    rank: int
    cell_id: str
    row_index: int
    hit_count: int       # 被多少个查询命中
    avg_distance: float
    obs: dict[str, Any]


class BatchSearchResponse(BaseModel):
    index_id: int
    dataset_id: int
    algorithm: str
    metric: str
    aggregate: str
    n_queries: int
    k: int
    n_returned: int
    total_latency_ms: float
    hits: list[BatchHit]
