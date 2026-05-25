"""Dataset ORM。"""
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.datasets.constants import STATUS_UPLOADING
from app.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")

    # 文件路径
    source_path: Mapped[str] = mapped_column(String(512))       # 原始 .h5ad 路径（可以是注册的绝对路径，也可以是上传后的相对路径）
    vectors_path: Mapped[str] = mapped_column(String(512), default="")  # .npy（float32, shape [n, d]）
    obs_path: Mapped[str] = mapped_column(String(512), default="")      # .parquet（细胞元数据）
    cell_ids_path: Mapped[str] = mapped_column(String(512), default="") # .npy（细胞ID顺序，与 vectors 行对齐）

    # 元信息
    n_cells: Mapped[int] = mapped_column(Integer, default=0)
    n_genes: Mapped[int] = mapped_column(Integer, default=0)
    vector_dim: Mapped[int] = mapped_column(Integer, default=0)
    embedding_key: Mapped[str] = mapped_column(String(32), default="X_pca")

    # 状态
    status: Mapped[str] = mapped_column(String(16), default=STATUS_UPLOADING, index=True)
    error_msg: Mapped[str] = mapped_column(Text, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
