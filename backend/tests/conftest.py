import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base
from app.core.dependencies import get_db

# StaticPool：所有连接共享同一底层连接，内存数据在 session 内持久存在
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """建表 + 创建默认管理员（整个 test session 只跑一次）。"""
    from app.auth.models import User  # noqa: F401
    Base.metadata.create_all(bind=engine)

    from app.auth.constants import ROLE_ADMIN, REVIEW_APPROVED, ACCOUNT_NORMAL
    from app.core.security import hash_password
    db = TestingSession()
    try:
        if not db.query(User).filter(User.role == ROLE_ADMIN).first():
            db.add(User(
                username="admin",
                email="admin@scann.local",
                hashed_password=hash_password("Admin@123456"),
                role=ROLE_ADMIN,
                review_status=REVIEW_APPROVED,
                account_status=ACCOUNT_NORMAL,
            ))
            db.commit()
    finally:
        db.close()


@pytest.fixture(autouse=True)
def clean_non_admin(setup_db):  # setup_db 先跑，保证表已存在
    """每个测试前清理非管理员用户，保证测试互不影响。"""
    from app.auth.models import User
    from app.auth.constants import ROLE_ADMIN
    db = TestingSession()
    try:
        db.query(User).filter(User.role != ROLE_ADMIN).delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── 测试辅助函数 ──────────────────────────────────────────────────────────────

def register(client, username="testuser", email="test@example.com", password="Test@1234"):
    return client.post("/api/auth/register", json={
        "username": username, "email": email, "password": password,
    })


def login(client, username="admin", password="Admin@123456"):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def admin_token(client) -> str:
    return login(client).json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
