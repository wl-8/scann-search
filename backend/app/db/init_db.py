"""初始化数据库表。

调用 `init_db()` 会确保所有 ORM 模型对应的表存在，并创建默认管理员账号。
所有模块的 ORM 类都需要在这里被 import，否则 SQLAlchemy 看不到它们。
"""
from app.db.base import Base
from app.db.session import SessionLocal, engine

# 注册所有 ORM 模型 —— import 即可，无需直接使用
from app.auth.models import User  # noqa: F401
from app.datasets import models as _datasets_models  # noqa: F401
from app.index import models as _index_models  # noqa: F401
from app.benchmark import models as _benchmark_models  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    from app.auth.constants import ACCOUNT_NORMAL, REVIEW_APPROVED, ROLE_ADMIN
    from app.core.config import settings
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == ROLE_ADMIN).first():
            db.add(User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=ROLE_ADMIN,
                review_status=REVIEW_APPROVED,
                account_status=ACCOUNT_NORMAL,
            ))
            db.commit()
    finally:
        db.close()
