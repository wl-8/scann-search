"""共享测试夹具：合成数据集 + 临时数据库 + FastAPI TestClient。

每个测试函数都获得：
- `synth_h5ad`：临时 .h5ad（500 个细胞，16 维 PCA，含 cell_type 与 disease 两列 obs）
- `db_session`：临时 SQLite session（每个测试用例独立 DB 文件）
- `client`：绑定到该临时 DB 的 FastAPI TestClient

策略：用 monkeypatch 改写 settings 的 UPLOAD_DIR / INDEX_DIR / DATABASE_URL 指向 tmp_path，
保证测试之间彻底隔离，绝不写到仓库的 data/ 或 app.db。
"""
from __future__ import annotations

from pathlib import Path

import anndata as ad
import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def synth_h5ad(tmp_path: Path) -> Path:
    rng = np.random.default_rng(0)
    n, d = 500, 16
    # 3 个簇，让 cell_type 与向量分布有相关性
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


@pytest.fixture
def isolated_settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """把 settings 的目录指向 tmp_path，并把 DB 指到 tmp 文件。"""
    from app.core import config as cfg

    upload = tmp_path / "uploads"
    indexes = tmp_path / "indexes"
    upload.mkdir()
    indexes.mkdir()

    monkeypatch.setattr(cfg.settings, "UPLOAD_DIR", str(upload))
    monkeypatch.setattr(cfg.settings, "INDEX_DIR", str(indexes))
    monkeypatch.setattr(cfg.settings, "DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")

    # session.py 在 import 时就读 settings，需要重新构建 engine
    from importlib import reload

    from app.db import session as db_session
    reload(db_session)

    # 让 init_db 用新的 engine
    from app.db import init_db as init_db_module
    reload(init_db_module)
    init_db_module.init_db()

    return tmp_path


@pytest.fixture
def db_session(isolated_settings):
    from app.db.session import SessionLocal
    sess = SessionLocal()
    try:
        yield sess
    finally:
        sess.close()


@pytest.fixture
def client(isolated_settings):
    # 必须在 reload(db_session) 之后再 import main
    from importlib import reload

    from fastapi.testclient import TestClient

    from app import main as main_module
    from app.core import dependencies as deps_module
    reload(deps_module)
    reload(main_module)

    with TestClient(main_module.app) as c:
        yield c
