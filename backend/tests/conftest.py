"""共享测试夹具：合成数据集 + 测试数据库 + FastAPI TestClient。

两种隔离策略并存：
- StaticPool 内存 DB：用于 auth/users 的 API 级测试，快速且无需文件 I/O
- isolated_settings：为 ANN datasets/index/search/benchmark 提供完全隔离的临时 SQLite 和文件目录
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.db.base import Base
from app.main import app

# ─── StaticPool 内存引擎（auth/users 测试专用） ───────────────────────────────

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
    from app.datasets import models as _ds  # noqa: F401
    from app.index import models as _idx  # noqa: F401
    from app.benchmark import models as _bm  # noqa: F401
    Base.metadata.create_all(bind=engine)

    from app.auth.constants import ACCOUNT_NORMAL, REVIEW_APPROVED, ROLE_ADMIN
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
def clean_non_admin(setup_db):
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
def client(tmp_path: Path, monkeypatch):
    """TestClient：StaticPool DB + 临时文件目录（auth/users 测试使用）。"""
    from app.core import config as cfg
    (tmp_path / "uploads").mkdir()
    (tmp_path / "indexes").mkdir()
    monkeypatch.setattr(cfg.settings, "UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.setattr(cfg.settings, "INDEX_DIR", str(tmp_path / "indexes"))
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── ANN 测试：隔离设置 + 临时 SQLite ────────────────────────────────────────

@pytest.fixture
def isolated_settings(tmp_path: Path, monkeypatch) -> Path:
    """把 settings 的目录和 DB 全部指向 tmp_path，保证 ANN 测试完全隔离。"""
    from app.core import config as cfg

    upload = tmp_path / "uploads"
    indexes = tmp_path / "indexes"
    upload.mkdir()
    indexes.mkdir()

    monkeypatch.setattr(cfg.settings, "UPLOAD_DIR", str(upload))
    monkeypatch.setattr(cfg.settings, "INDEX_DIR", str(indexes))
    monkeypatch.setattr(cfg.settings, "DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")

    from importlib import reload

    from app.db import session as db_session_mod
    reload(db_session_mod)

    from app.db import init_db as init_db_module
    reload(init_db_module)
    init_db_module.init_db()

    return tmp_path


@pytest.fixture
def db_session(isolated_settings):
    """直接 DB session，供 ANN 服务层测试使用。"""
    from app.db.session import SessionLocal
    sess = SessionLocal()
    try:
        yield sess
    finally:
        sess.close()


# ─── ANN 合成数据 ──────────────────────────────────────────────────────────────

@pytest.fixture
def synth_h5ad(tmp_path: Path) -> Path:
    import anndata as ad
    import numpy as np
    import pandas as pd

    rng = np.random.default_rng(0)
    n, d = 500, 16
    centers = rng.normal(scale=3.0, size=(3, d)).astype(np.float32)
    labels = rng.integers(0, 3, size=n)
    X = (centers[labels] + rng.normal(scale=1.0, size=(n, d))).astype(np.float32)

    obs = pd.DataFrame({
        "cell_type": [f"Type{labels[i]}" for i in range(n)],
        "disease": ["normal" if i % 5 else "diseased" for i in range(n)],
    }, index=[f"cell_{i:04d}" for i in range(n)])
    var = pd.DataFrame(index=[f"gene_{j}" for j in range(d)])

    adata = ad.AnnData(X=np.zeros((n, d), dtype=np.float32), obs=obs, var=var)
    adata.obsm["X_pca"] = X

    out = tmp_path / "synth.h5ad"
    adata.write_h5ad(out)
    return out


# ─── 认证辅助函数 ──────────────────────────────────────────────────────────────

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
