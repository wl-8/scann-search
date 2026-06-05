"""共享测试夹具：合成数据集 + 隔离数据库 + FastAPI TestClient。

每个测试得到独立的临时 SQLite 和文件目录（isolated_settings），
client 与 db_session 共享同一数据库，保证 HTTP 层测试与服务层测试的数据一致。
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_db
from app.main import app


# ─── 隔离设置（每个测试独立 SQLite + 临时目录） ──────────────────────────────

@pytest.fixture
def isolated_settings(tmp_path: Path, monkeypatch) -> Path:
    """把 settings 的目录和 DB 全部指向 tmp_path，调用 init_db() 建表并创建管理员。"""
    from app.core import config as cfg

    upload = tmp_path / "uploads"
    indexes = tmp_path / "indexes"
    upload.mkdir(exist_ok=True)
    indexes.mkdir(exist_ok=True)

    monkeypatch.setattr(cfg.settings, "UPLOAD_DIR", str(upload))
    monkeypatch.setattr(cfg.settings, "INDEX_DIR", str(indexes))
    monkeypatch.setattr(cfg.settings, "DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setattr(cfg.settings, "AUTO_BOOTSTRAP_DATA", False)

    from importlib import reload

    from app.db import session as db_session_mod
    reload(db_session_mod)

    from app.db import init_db as init_db_module
    reload(init_db_module)
    init_db_module.init_db()

    return tmp_path


@pytest.fixture
def db_session(isolated_settings):
    """直接 DB session，供服务层测试使用。"""
    from app.db.session import SessionLocal
    sess = SessionLocal()
    try:
        yield sess
    finally:
        sess.close()


@pytest.fixture
def client(isolated_settings):
    """TestClient：与 db_session 共享同一临时 SQLite，管理员账号由 init_db() 创建。"""
    from app.db.session import SessionLocal
    from app.export import cache as export_cache

    def _override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    export_cache.search_cache.clear()
    export_cache.filter_cache.clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


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
