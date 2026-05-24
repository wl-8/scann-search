from app.db.session import engine, SessionLocal
from app.db.base import Base


def init_db() -> None:
    # Import all models here so Base.metadata knows about them
    from app.auth.models import User  # noqa: F401

    Base.metadata.create_all(bind=engine)

    from app.core.config import settings
    from app.auth.constants import ROLE_ADMIN, REVIEW_APPROVED, ACCOUNT_NORMAL
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == ROLE_ADMIN).first():
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=ROLE_ADMIN,
                review_status=REVIEW_APPROVED,
                account_status=ACCOUNT_NORMAL,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()
