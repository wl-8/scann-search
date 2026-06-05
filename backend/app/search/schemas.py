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


# ---------- 多数据集查询 ----------

class MultiDatasetSearchRequest(BaseModel):
    """跨多个索引/数据集做一次联合 Top-K 检索。

    cell_id 查询需要先从 source_index_id 所在数据集中解析查询向量；
    不传 source_index_id 时，会按 index_ids 顺序使用第一个包含该 cell_id 的数据集。
    """
    index_ids: Annotated[list[int], Field(min_length=1, max_length=20)]
    source_index_id: int | None = None
    cell_id: str | None = None
    vector: list[float] | None = None
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter | None = None
    oversample: int | None = Field(default=None, ge=1, le=500)
    metric: Literal["l2", "cosine"] = "l2"

    @model_validator(mode="after")
    def _check_query_source(self) -> "MultiDatasetSearchRequest":
        if not self.cell_id and not self.vector:
            raise ValueError("必须提供 cell_id 或 vector")
        if self.cell_id and self.vector:
            raise ValueError("cell_id 和 vector 只能提供一个")
        if self.vector is not None and not self.vector:
            raise ValueError("vector 不能为空")
        return self


class MultiDatasetHit(SearchHit):
    index_id: int
    dataset_id: int
    algorithm: str


class SkippedIndex(BaseModel):
    index_id: int
    dataset_id: int | None = None
    reason: str


class MultiDatasetSearchResponse(BaseModel):
    index_ids: list[int]
    dataset_ids: list[int]
    metric: str
    k: int
    n_returned: int
    total_latency_ms: float
    filter_applied: bool
    hits: list[MultiDatasetHit]
    skipped: list[SkippedIndex] = Field(default_factory=list)


# ---------- 严格联合索引查询 ----------

class CombinedIndexSearchRequest(BaseModel):
    """Query one physical combined index built from multiple datasets."""

    combined_index_id: int
    source_dataset_id: int | None = Field(
        default=None,
        description="cell_id 查询时指定来源数据集；不传则按联合索引 dataset_ids 顺序查找",
    )
    cell_id: str | None = None
    vector: list[float] | None = None
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter | None = None
    oversample: int | None = Field(default=None, ge=1, le=500)
    metric: Literal["l2", "cosine"] = "l2"

    @model_validator(mode="after")
    def _check_query_source(self) -> "CombinedIndexSearchRequest":
        if not self.cell_id and not self.vector:
            raise ValueError("必须提供 cell_id 或 vector")
        if self.cell_id and self.vector:
            raise ValueError("cell_id 和 vector 只能提供一个")
        if self.vector is not None and not self.vector:
            raise ValueError("vector 不能为空")
        return self


class CombinedIndexHit(SearchHit):
    combined_index_id: int
    dataset_id: int
    global_row_index: int
    algorithm: str


class CombinedIndexSearchResponse(BaseModel):
    combined_index_id: int
    dataset_ids: list[int]
    algorithm: str
    metric: str
    k: int
    n_returned: int
    latency_ms: float
    filter_applied: bool
    hits: list[CombinedIndexHit]


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


# ---------- 过滤策略对比 ----------

FilterStrategyName = Literal["post", "pre", "hybrid"]


class CompareStrategiesRequest(BaseModel):
    """跑同一查询在三种过滤策略下的对比。

    必填一个 cell_id 或一个 vector；两者都给时优先 cell_id。
    filters 必填且非空，否则对比没有意义。
    """
    index_id: int
    cell_id: str | None = None
    vector: list[float] | None = None
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    filters: SearchFilter
    metric: Literal["l2", "cosine"] = "l2"
    strategies: list[FilterStrategyName] = Field(
        default_factory=lambda: ["post", "pre", "hybrid"],
        description="要对比的策略子集；hybrid 仅适用于 HNSW，其它算法会被跳过",
    )
    oversample: int = Field(
        default=10, ge=1, le=500,
        description="post-filter 的 oversample 倍数；pre/hybrid 不用",
    )

    @model_validator(mode="after")
    def _check_query_source(self) -> "CompareStrategiesRequest":
        if not self.cell_id and not self.vector:
            raise ValueError("必须提供 cell_id 或 vector")
        if not (self.filters.equals or self.filters.gte or self.filters.lte):
            raise ValueError("filters 不能为空，否则对比策略无意义")
        return self


class StrategyResult(BaseModel):
    strategy: str                # post / pre / hybrid
    n_returned: int
    requested_k: int
    latency_ms: float
    recall_at_k: float           # 相对 pre 的 ground truth（pre 自己永远是 1.0）
    extra: dict[str, Any] = Field(default_factory=dict)
    hits: list[SearchHit]


class CompareStrategiesResponse(BaseModel):
    index_id: int
    dataset_id: int
    algorithm: str
    metric: str
    k: int
    n_total_cells: int
    n_matching_filter: int       # 多少个 cell 匹配 filters
    filter_selectivity: float    # n_matching_filter / n_total_cells
    results: list[StrategyResult]
