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
