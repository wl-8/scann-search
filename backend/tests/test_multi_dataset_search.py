"""HTTP tests for true multi-dataset search."""
from __future__ import annotations

from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from app.index import service as idx_service
from app.index.schemas import IndexBuildRequest
from tests.conftest import admin_token, auth_header


def test_multi_dataset_search_by_cell_merges_dataset_aware_hits(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))

    ds1 = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="multi-ds-a", source_path=str(synth_h5ad)),
    )
    ds2 = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="multi-ds-b", source_path=str(synth_h5ad)),
    )
    idx1 = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds1.id, algorithm="flat", params={}),
    )
    idx2 = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds2.id, algorithm="flat", params={}),
    )

    resp = client.post(
        "/api/search/multi-dataset",
        json={
            "index_ids": [idx1.id, idx2.id],
            "source_index_id": idx1.id,
            "cell_id": "cell_0042",
            "k": 8,
        },
        headers=headers,
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["index_ids"] == [idx1.id, idx2.id]
    assert body["dataset_ids"] == [ds1.id, ds2.id]
    assert body["n_returned"] == 8
    assert body["skipped"] == []

    hits = body["hits"]
    assert {h["dataset_id"] for h in hits}.issubset({ds1.id, ds2.id})
    assert {h["index_id"] for h in hits}.issubset({idx1.id, idx2.id})
    assert all("algorithm" in h for h in hits)
    assert hits == sorted(hits, key=lambda h: h["distance"])
    assert all(not (h["dataset_id"] == ds1.id and h["cell_id"] == "cell_0042") for h in hits)


def test_multi_dataset_search_skips_dimension_mismatch(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="multi-ds-dim", source_path=str(synth_h5ad)),
    )
    idx = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds.id, algorithm="flat", params={}),
    )

    resp = client.post(
        "/api/search/multi-dataset",
        json={
            "index_ids": [idx.id],
            "vector": [0.0, 1.0, 2.0],
            "k": 5,
        },
        headers=headers,
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["n_returned"] == 0
    assert body["skipped"][0]["index_id"] == idx.id
    assert "维度" in body["skipped"][0]["reason"]
