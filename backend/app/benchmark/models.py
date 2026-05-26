"""Benchmark ORM —— 两张表：一批跑批 (BenchmarkBatch) + 每算法结果 (BenchmarkResult)。"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BenchmarkBatch(Base):
    """一次完整跑批（一个 /run 请求）的元信息。"""
    __tablename__ = "benchmark_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(128), index=True, default="")
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    k: Mapped[int] = mapped_column(Integer)
    n_queries: Mapped[int] = mapped_column(Integer)
    seed: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    results: Mapped[list["BenchmarkResult"]] = relationship(
        "BenchmarkResult", back_populates="batch", cascade="all, delete-orphan", lazy="selectin"
    )


class BenchmarkResult(Base):
    """某批中单个算法的评测指标行。"""
    __tablename__ = "benchmark_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("benchmark_batches.id", ondelete="CASCADE"), index=True
    )

    algorithm: Mapped[str] = mapped_column(String(32), index=True)
    params: Mapped[dict] = mapped_column(JSON, default=dict)

    recall_at_k: Mapped[float] = mapped_column(default=0.0)
    avg_latency_ms: Mapped[float] = mapped_column(default=0.0)
    p50_latency_ms: Mapped[float] = mapped_column(default=0.0)
    p95_latency_ms: Mapped[float] = mapped_column(default=0.0)
    p99_latency_ms: Mapped[float] = mapped_column(default=0.0)
    qps: Mapped[float] = mapped_column(default=0.0)
    build_time_ms: Mapped[float] = mapped_column(default=0.0)
    index_size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    batch: Mapped["BenchmarkBatch"] = relationship("BenchmarkBatch", back_populates="results")
