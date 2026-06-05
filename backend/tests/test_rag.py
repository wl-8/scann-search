"""RAG API tests."""
from __future__ import annotations

from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from tests.conftest import admin_token, auth_header


def test_rag_local_query_interprets_obs_values(client, synth_h5ad, db_session) -> None:
    token = admin_token(client)
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="rag-ds", source_path=str(synth_h5ad)),
    )

    resp = client.post(
        "/api/rag/query",
        json={
            "question": "请查找 normal Type1 cells，并总结证据",
            "dataset_ids": [ds.id],
            "k": 5,
            "llm": {"provider": "local"},
        },
        headers=auth_header(token),
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["llm_used"] is False
    assert body["provider"] == "local"
    assert body["target_dataset_ids"] == [ds.id]
    assert body["interpreted_filters"]["equals"]["cell_type"] == ["Type1"]
    assert body["interpreted_filters"]["equals"]["disease"] == ["normal"]
    assert body["evidence"][0]["total_matches"] > 0
    assert len(body["evidence"][0]["sampled_cells"]) <= 5
    assert "Type1" in body["answer"]
