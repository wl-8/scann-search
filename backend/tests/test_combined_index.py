"""HTTP tests for strict physical combined indexes."""
from __future__ import annotations

from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from app.index import service as idx_service
from app.index.schemas import CombinedIndexBuildRequest
from tests.conftest import admin_token, auth_header


def test_combined_index_build_and_search_by_cell(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    ds1 = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="combined-ds-a", source_path=str(synth_h5ad)),
    )
    ds2 = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="combined-ds-b", source_path=str(synth_h5ad)),
    )
    combined = idx_service.build_combined(
        db_session,
        CombinedIndexBuildRequest(
            name="combined-flat",
            dataset_ids=[ds1.id, ds2.id],
            algorithm="flat",
            params={},
        ),
    )

    resp = client.post(
        "/api/search/combined-index",
        json={
            "combined_index_id": combined.id,
            "source_dataset_id": ds1.id,
            "cell_id": "cell_0042",
            "k": 8,
        },
        headers=headers,
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["combined_index_id"] == combined.id
    assert body["dataset_ids"] == [ds1.id, ds2.id]
    assert body["n_returned"] == 8
    assert body["algorithm"] == "flat"

    hits = body["hits"]
    assert {h["dataset_id"] for h in hits}.issubset({ds1.id, ds2.id})
    assert all("global_row_index" in h for h in hits)
    assert all(h["combined_index_id"] == combined.id for h in hits)
    assert all(not (h["dataset_id"] == ds1.id and h["cell_id"] == "cell_0042") for h in hits)


def test_combined_index_requires_same_vector_dim(client, synth_h5ad, tmp_path, db_session) -> None:
    import anndata as ad
    import numpy as np
    import pandas as pd

    headers = auth_header(admin_token(client))
    ds1 = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="combined-dim-a", source_path=str(synth_h5ad)),
    )

    obs = pd.DataFrame(index=[f"other_{i:03d}" for i in range(20)])
    var = pd.DataFrame(index=[f"gene_{i}" for i in range(8)])
    adata = ad.AnnData(X=np.zeros((20, 8), dtype=np.float32), obs=obs, var=var)
    adata.obsm["X_pca"] = np.zeros((20, 8), dtype=np.float32)
    other = tmp_path / "other_dim.h5ad"
    adata.write_h5ad(other)
    ds2 = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="combined-dim-b", source_path=str(other)),
    )

    resp = client.post(
        "/api/index/combined/build",
        json={
            "name": "bad-combined",
            "dataset_ids": [ds1.id, ds2.id],
            "algorithm": "flat",
            "params": {},
        },
        headers=headers,
    )

    assert resp.status_code == 400, resp.text
    assert "维度一致" in resp.json()["detail"]
