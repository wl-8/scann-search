"""性能评测模块 Pydantic schema。"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AlgorithmConfig(BaseModel):
    algorithm: str
    params: dict[str, Any] = Field(default_factory=dict)


class BenchmarkRunRequest(BaseModel):
    dataset_id: int
    algorithms: list[AlgorithmConfig] = Field(min_length=1)
    k: int = Field(default=10, ge=1, le=100)
    n_queries: int = Field(default=100, ge=1, le=10000, description="随机抽多少条向量作查询")
    seed: int = Field(default=42)


class BenchmarkResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    batch_id: str
    algorithm: str
    params: dict[str, Any]
    k: int
    n_queries: int
    recall_at_k: float
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    qps: float
    build_time_ms: float
    index_size_bytes: int
    created_at: datetime


class BenchmarkRunResponse(BaseModel):
    batch_id: str
    dataset_id: int
    k: int
    n_queries: int
    results: list[BenchmarkResultItem]
