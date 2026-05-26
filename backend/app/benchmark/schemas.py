"""性能评测模块 Pydantic schema。"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AlgorithmConfig(BaseModel):
    algorithm: str
    params: dict[str, Any] = Field(default_factory=dict)


class BenchmarkRunRequest(BaseModel):
    dataset_id: int
    label: str = Field(default="", max_length=128, description="批次标签；留空则自动生成 ds{id}_algo1+algo2")
    algorithms: list[AlgorithmConfig] = Field(min_length=1)
    k: int = Field(default=10, ge=1, le=100)
    n_queries: int = Field(default=100, ge=1, le=10000, description="随机抽多少条向量作查询")
    seed: int = Field(default=42)


class BenchmarkResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: int
    algorithm: str
    params: dict[str, Any]
    recall_at_k: float
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    qps: float
    build_time_ms: float
    index_size_bytes: int


class BenchmarkBatchItem(BaseModel):
    """批次列表中的摘要行（不含 results）。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    dataset_id: int
    k: int
    n_queries: int
    seed: int
    created_at: datetime


class BenchmarkBatchDetail(BaseModel):
    """批次详情，含嵌套算法结果。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    dataset_id: int
    k: int
    n_queries: int
    seed: int
    created_at: datetime
    results: list[BenchmarkResultItem]
