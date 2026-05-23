"""初始化数据库表。

调用 `init_db()` 会确保所有 ORM 模型对应的表存在。
所有模块的 ORM 类都需要在这里被 import，否则 SQLAlchemy 看不到它们。
"""
from app.db.base import Base
from app.db.session import engine

# 注册所有 ORM 模型 —— import 即可，无需直接使用
from app.datasets import models as _datasets_models  # noqa: F401
from app.index import models as _index_models  # noqa: F401
from app.benchmark import models as _benchmark_models  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
