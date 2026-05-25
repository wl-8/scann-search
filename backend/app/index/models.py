"""Index ORM。"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.index.constants import STATUS_BUILDING


class Index(Base):
    __tablename__ = "indexes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)

    algorithm: Mapped[str] = mapped_column(String(32), index=True)
    params: Mapped[dict] = mapped_column(JSON, default=dict)

    file_path: Mapped[str] = mapped_column(String(512), default="")
    status: Mapped[str] = mapped_column(String(16), default=STATUS_BUILDING, index=True)
    error_msg: Mapped[str] = mapped_column(Text, default="")

    # 用于性能对比：构建时刻指标
    build_time_ms: Mapped[float] = mapped_column(default=0.0)
    index_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    n_vectors: Mapped[int] = mapped_column(Integer, default=0)
    vector_dim: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
