"""BenchmarkRun ORM —— 一次跑批的一行结果。"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BenchmarkRun(Base):
    """一次跑批 = 一个 (dataset, algorithm, params) 组合下的一组指标。"""
    __tablename__ = "benchmark_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    batch_id: Mapped[str] = mapped_column(String(64), index=True, default="")  # 同一次 /run 共享同一个 batch_id

    algorithm: Mapped[str] = mapped_column(String(32), index=True)
    params: Mapped[dict] = mapped_column(JSON, default=dict)

    k: Mapped[int] = mapped_column(Integer)
    n_queries: Mapped[int] = mapped_column(Integer)

    recall_at_k: Mapped[float] = mapped_column(default=0.0)
    avg_latency_ms: Mapped[float] = mapped_column(default=0.0)
    p50_latency_ms: Mapped[float] = mapped_column(default=0.0)
    p95_latency_ms: Mapped[float] = mapped_column(default=0.0)
    p99_latency_ms: Mapped[float] = mapped_column(default=0.0)
    qps: Mapped[float] = mapped_column(default=0.0)

    build_time_ms: Mapped[float] = mapped_column(default=0.0)
    index_size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
