"""集成测试：数据集注册流程（read .h5ad → 抽 PCA → 落 .npy/.parquet → 写库）。"""
from __future__ import annotations

import numpy as np
import pytest

from app.datasets import service as ds_service
from app.datasets.exceptions import DatasetNameConflict, EmbeddingKeyMissing
from app.datasets.schemas import DatasetRegisterRequest


def test_register_and_load_artifacts(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="synth", source_path=str(synth_h5ad)),
    )
    assert ds.status == "ready"
    assert ds.n_cells == 500
    assert ds.vector_dim == 16

    vectors = ds_service.load_vectors(ds)
    cell_ids = ds_service.load_cell_ids(ds)
    obs = ds_service.load_obs(ds)

    assert vectors.shape == (500, 16)
    assert vectors.dtype == np.float32
    assert len(cell_ids) == 500
    assert set(obs.columns) >= {"cell_type", "disease"}


def test_register_with_duplicate_name_conflicts(synth_h5ad, db_session) -> None:
    req = DatasetRegisterRequest(name="dup", source_path=str(synth_h5ad))
    ds_service.register(db_session, req)
    with pytest.raises(DatasetNameConflict):
        ds_service.register(db_session, req)


def test_register_with_missing_embedding_key_raises(synth_h5ad, db_session) -> None:
    with pytest.raises(EmbeddingKeyMissing):
        ds_service.register(
            db_session,
            DatasetRegisterRequest(
                name="bad", source_path=str(synth_h5ad), embedding_key="X_does_not_exist",
            ),
        )


def test_find_cell_row(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="lookup", source_path=str(synth_h5ad)),
    )
    row = ds_service.find_cell_row(ds, "cell_0042")
    assert row == 42


def test_value_counts(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="stats", source_path=str(synth_h5ad)),
    )
    counts = ds_service.value_counts(ds)
    assert "cell_type" in counts
    assert "disease" in counts
    assert sum(counts["disease"].values()) == 500


def test_filter_cells_by_disease(synth_h5ad, db_session) -> None:
    from app.datasets.schemas import FilterSpec
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="filter-test", source_path=str(synth_h5ad)),
    )
    items, total = ds_service.filter_cells(
        ds, FilterSpec(equals={"disease": ["normal"]}), offset=0, limit=100
    )
    assert total > 0
    assert all(item["obs"]["disease"] == "normal" for item in items)


def test_filter_cells_unknown_column_returns_empty(synth_h5ad, db_session) -> None:
    from app.datasets.schemas import FilterSpec
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="filter-miss", source_path=str(synth_h5ad)),
    )
    items, total = ds_service.filter_cells(
        ds, FilterSpec(equals={"nonexistent_col": ["x"]}), offset=0, limit=50
    )
    assert total == 0
    assert items == []


def test_filter_cells_http(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="filter-http", source_path=str(synth_h5ad)),
    )
    resp = client.post(
        f"/api/datasets/{ds.id}/cells/filter",
        json={"filters": {"equals": {"disease": ["normal"]}}, "offset": 0, "limit": 20},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total_matched"] > 0
    assert len(body["items"]) <= 20
    assert all(item["obs"]["disease"] == "normal" for item in body["items"])


def test_filter_cells_pagination(synth_h5ad, db_session) -> None:
    from app.datasets.schemas import FilterSpec
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="filter-page", source_path=str(synth_h5ad)),
    )
    f = FilterSpec(equals={"disease": ["normal"]})
    items_p1, total = ds_service.filter_cells(ds, f, offset=0, limit=10)
    items_p2, _ = ds_service.filter_cells(ds, f, offset=10, limit=10)
    assert len(items_p1) == 10
    assert items_p1[0]["cell_id"] != items_p2[0]["cell_id"]


def test_delete_removes_artifacts(synth_h5ad, db_session) -> None:
    from pathlib import Path

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="todel", source_path=str(synth_h5ad)),
    )
    paths = [Path(ds.vectors_path), Path(ds.cell_ids_path), Path(ds.obs_path)]
    for p in paths:
        assert p.exists()

    ds_service.delete(db_session, ds.id)
    for p in paths:
        assert not p.exists()
    refreshed = db_session.get(type(ds), ds.id)
    assert refreshed.status == "deleted"


def test_delete_cascades_to_indexes(synth_h5ad, db_session) -> None:
    from pathlib import Path
    from app.index import service as idx_service
    from app.index.schemas import IndexBuildRequest
    from app.index.service import _index_cache

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="cascade-ds", source_path=str(synth_h5ad)),
    )
    idx = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds.id, algorithm="flat", params={}),
    )
    idx_file = Path(idx.file_path)
    assert idx_file.exists()
    assert idx.id in _index_cache

    ds_service.delete(db_session, ds.id)

    assert not idx_file.exists()
    assert idx.id not in _index_cache
    db_session.expire(idx)
    assert db_session.get(type(idx), idx.id).status == "deleted"
