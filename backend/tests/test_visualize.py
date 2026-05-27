"""可视化模块集成测试。"""
from __future__ import annotations

import numpy as np
import pytest

from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from app.visualize import service as viz_service
from app.visualize.exceptions import ColorByColumnNotFound, UnsupportedMode


# ─── get_modes ────────────────────────────────────────────────────────────────

def test_get_modes_3d(synth_h5ad, db_session) -> None:
    """X_pca 16D → 支持 2d 和 3d。"""
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="modes-3d", source_path=str(synth_h5ad)),
    )
    resp = viz_service.get_modes(db_session, ds.id)
    assert resp.dataset_id == ds.id
    assert resp.embedding_key == "X_pca"
    assert resp.vector_dim == 16
    assert "2d" in resp.available_modes
    assert "3d" in resp.available_modes
    assert "cell_type" in resp.color_options
    assert "disease" in resp.color_options


def test_get_modes_2d_only(tmp_path, db_session) -> None:
    """2D embedding → 只支持 2d。"""
    import anndata as ad
    import pandas as pd

    rng = np.random.default_rng(1)
    n = 200
    obs = pd.DataFrame(
        {"cell_type": ["A"] * n},
        index=[f"c{i}" for i in range(n)],
    )
    adata = ad.AnnData(X=np.zeros((n, 2), dtype=np.float32), obs=obs,
                       var=pd.DataFrame(index=["g0", "g1"]))
    adata.obsm["X_umap"] = rng.normal(size=(n, 2)).astype(np.float32)
    p = tmp_path / "umap2d.h5ad"
    adata.write_h5ad(p)

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="modes-2d", source_path=str(p), embedding_key="X_umap"),
    )
    resp = viz_service.get_modes(db_session, ds.id)
    assert resp.available_modes == ["2d"]
    assert "3d" not in resp.available_modes


# ─── get_embedding ────────────────────────────────────────────────────────────

def test_get_embedding_2d(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="emb-2d", source_path=str(synth_h5ad)),
    )
    resp = viz_service.get_embedding(db_session, ds.id, mode="2d", color_by="cell_type", max_points=50_000)

    assert resp.dataset_id == ds.id
    assert resp.mode == "2d"
    assert resp.color_by == "cell_type"
    assert resp.n_total == 500
    assert resp.n_returned == 500  # 数据量 < max_points，不降采样
    assert len(resp.points) == 500

    pt = resp.points[0]
    assert isinstance(pt.x, float)
    assert isinstance(pt.y, float)
    assert pt.z is None  # 2D 不返回 z
    assert pt.label in {"Type0", "Type1", "Type2"}
    assert "cell_type" in pt.obs
    assert "disease" in pt.obs


def test_get_embedding_3d(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="emb-3d", source_path=str(synth_h5ad)),
    )
    resp = viz_service.get_embedding(db_session, ds.id, mode="3d", color_by="disease", max_points=50_000)

    assert resp.mode == "3d"
    assert all(pt.z is not None for pt in resp.points)


def test_get_embedding_downsampling(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="emb-ds", source_path=str(synth_h5ad)),
    )
    resp = viz_service.get_embedding(db_session, ds.id, mode="2d", color_by="cell_type", max_points=100)

    assert resp.n_total == 500
    assert resp.n_returned <= 100
    # 三种细胞类型都应被保留（分层采样）
    labels_returned = {pt.label for pt in resp.points}
    assert len(labels_returned) == 3


def test_get_embedding_invalid_mode(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="emb-badmode", source_path=str(synth_h5ad)),
    )
    with pytest.raises(UnsupportedMode):
        viz_service.get_embedding(db_session, ds.id, mode="4d", color_by="cell_type", max_points=50_000)


def test_get_embedding_invalid_color_by(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="emb-badcol", source_path=str(synth_h5ad)),
    )
    with pytest.raises(ColorByColumnNotFound):
        viz_service.get_embedding(db_session, ds.id, mode="2d", color_by="nonexistent_col", max_points=50_000)


def test_get_embedding_rejects_high_cardinality_color_by(tmp_path, db_session) -> None:
    import anndata as ad
    import pandas as pd

    rng = np.random.default_rng(5)
    n = 300
    obs = pd.DataFrame(
        {
            "cell_type": [f"UniqueType{i}" for i in range(n)],   # 300 个不同值 > 200
            "disease": ["normal"] * n,
        },
        index=[f"c{i}" for i in range(n)],
    )
    adata = ad.AnnData(
        X=np.zeros((n, 4), dtype=np.float32),
        obs=obs,
        var=pd.DataFrame(index=[f"g{j}" for j in range(4)]),
    )
    adata.obsm["X_pca"] = rng.normal(size=(n, 4)).astype(np.float32)
    p = tmp_path / "hc.h5ad"
    adata.write_h5ad(p)

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="emb-hc", source_path=str(p)),
    )
    with pytest.raises(ColorByColumnNotFound):
        viz_service.get_embedding(db_session, ds.id, mode="2d", color_by="cell_type", max_points=50_000)

    resp = viz_service.get_embedding(db_session, ds.id, mode="2d", color_by="disease", max_points=50_000)
    assert resp.color_by == "disease"


# ─── locate_cells ─────────────────────────────────────────────────────────────

def test_locate_cells_returns_coords(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="locate-ok", source_path=str(synth_h5ad)),
    )
    resp = viz_service.locate_cells(db_session, ds.id, ["cell_0000", "cell_0001", "cell_0099"], "2d")

    assert resp.dataset_id == ds.id
    assert resp.mode == "2d"
    assert len(resp.points) == 3
    ids_returned = {pt.cell_id for pt in resp.points}
    assert ids_returned == {"cell_0000", "cell_0001", "cell_0099"}
    for pt in resp.points:
        assert isinstance(pt.x, float)
        assert isinstance(pt.y, float)
        assert pt.z is None


def test_locate_cells_3d(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="locate-3d", source_path=str(synth_h5ad)),
    )
    resp = viz_service.locate_cells(db_session, ds.id, ["cell_0010"], "3d")
    assert len(resp.points) == 1
    assert resp.points[0].z is not None


def test_locate_cells_unknown_ignored(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="locate-miss", source_path=str(synth_h5ad)),
    )
    resp = viz_service.locate_cells(db_session, ds.id, ["cell_0000", "no_such_cell"], "2d")
    assert len(resp.points) == 1
    assert resp.points[0].cell_id == "cell_0000"


def test_locate_cells_row_index(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="locate-idx", source_path=str(synth_h5ad)),
    )
    resp = viz_service.locate_cells(db_session, ds.id, ["cell_0042"], "2d")
    assert resp.points[0].row_index == 42


# ─── HTTP 层测试 ───────────────────────────────────────────────────────────────

def test_http_modes(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="http-modes", source_path=str(synth_h5ad)),
    )
    resp = client.get(f"/api/visualize/{ds.id}/modes", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["dataset_id"] == ds.id
    assert "2d" in body["available_modes"]


def test_http_embedding(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="http-emb", source_path=str(synth_h5ad)),
    )
    resp = client.get(
        f"/api/visualize/{ds.id}/embedding",
        params={"mode": "2d", "color_by": "cell_type", "max_points": 200},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["n_total"] == 500
    assert body["n_returned"] <= 200
    assert len(body["points"]) == body["n_returned"]


def test_http_locate(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="http-locate", source_path=str(synth_h5ad)),
    )
    resp = client.post(
        f"/api/visualize/{ds.id}/locate",
        json={"cell_ids": ["cell_0000", "cell_0001"], "mode": "2d"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["points"]) == 2


def test_http_switch_embedding(client, db_session) -> None:
    """PUT /api/datasets/{id}/embedding 切换成功后返回更新后的数据集信息。"""
    import anndata as ad
    import pandas as pd
    from pathlib import Path
    from tests.conftest import admin_token, auth_header

    headers = auth_header(admin_token(client))

    # 建一个临时双 obsm 数据集
    tmp = Path(client.app.dependency_overrides[
        next(k for k in client.app.dependency_overrides)
    ].__code__.co_freevars[0] if False else "/tmp") / "sw_emb_test"

    # 直接写到系统 tmp（isolated_settings 指向 tmp_path，这里用 db_session 注册）
    import tempfile, os
    rng = np.random.default_rng(7)
    n, d = 200, 8
    obs = pd.DataFrame(
        {"cell_type": ["A"] * n, "disease": ["normal"] * n},
        index=[f"c{i}" for i in range(n)],
    )
    adata = ad.AnnData(X=np.zeros((n, d), dtype=np.float32), obs=obs,
                       var=pd.DataFrame(index=[f"g{i}" for i in range(d)]))
    adata.obsm["X_pca"] = rng.normal(size=(n, d)).astype(np.float32)
    adata.obsm["X_umap"] = rng.normal(size=(n, 2)).astype(np.float32)

    with tempfile.NamedTemporaryFile(suffix=".h5ad", delete=False) as f:
        p = f.name
    adata.write_h5ad(p)

    try:
        ds = ds_service.register(
            db_session,
            DatasetRegisterRequest(name="sw-http", source_path=p),
        )
        assert ds.embedding_key == "X_pca"

        resp = client.put(
            f"/api/datasets/{ds.id}/embedding",
            json={"embedding_key": "X_umap"},
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["embedding_key"] == "X_umap"
        assert body["vector_dim"] == 2
        assert body["status"] == "ready"
    finally:
        os.unlink(p)
