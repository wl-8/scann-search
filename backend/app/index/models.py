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


class CombinedIndex(Base):
    """A physical ANN index built from multiple datasets.

    Each vector is addressed by a global row id. The sidecar mapping file maps
    that global id back to (dataset_id, row_index, cell_id).
    """

    __tablename__ = "combined_indexes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    dataset_ids: Mapped[list[int]] = mapped_column(JSON, default=list)

    algorithm: Mapped[str] = mapped_column(String(32), index=True)
    params: Mapped[dict] = mapped_column(JSON, default=dict)

    file_path: Mapped[str] = mapped_column(String(512), default="")
    mapping_path: Mapped[str] = mapped_column(String(512), default="")
    status: Mapped[str] = mapped_column(String(16), default=STATUS_BUILDING, index=True)
    error_msg: Mapped[str] = mapped_column(Text, default="")

    build_time_ms: Mapped[float] = mapped_column(default=0.0)
    index_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    n_vectors: Mapped[int] = mapped_column(Integer, default=0)
    vector_dim: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
