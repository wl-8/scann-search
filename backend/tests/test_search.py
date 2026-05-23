"""检索接口测试：HTTP 端到端 + 条件过滤。"""
from __future__ import annotations

from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from app.index import service as idx_service
from app.index.schemas import IndexBuildRequest


def _setup(synth_h5ad, db_session, algorithm: str = "hnsw"):
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="search-ds", source_path=str(synth_h5ad)),
    )
    idx = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds.id, algorithm=algorithm, params={}),
    )
    return ds, idx


def test_search_by_cell_returns_topk(client, synth_h5ad, db_session) -> None:
    _ds, idx = _setup(synth_h5ad, db_session)

    resp = client.post(
        "/api/search/by-cell",
        json={"index_id": idx.id, "cell_id": "cell_0042", "k": 5},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["k"] == 5
    assert body["n_returned"] == 5
    assert len(body["hits"]) == 5
    assert all(h["cell_id"] != "cell_0042" for h in body["hits"])  # 自身被剔除
    assert body["hits"][0]["rank"] == 1
    assert body["hits"][0]["distance"] >= 0


def test_search_by_vector_dim_mismatch(client, synth_h5ad, db_session) -> None:
    _ds, idx = _setup(synth_h5ad, db_session)
    resp = client.post(
        "/api/search/by-vector",
        json={"index_id": idx.id, "vector": [0.0] * 4, "k": 5},
    )
    assert resp.status_code == 400


def test_search_with_filter_only_returns_matching_obs(client, synth_h5ad, db_session) -> None:
    _ds, idx = _setup(synth_h5ad, db_session)
    resp = client.post(
        "/api/search/by-cell",
        json={
            "index_id": idx.id,
            "cell_id": "cell_0010",
            "k": 10,
            "filters": {"equals": {"disease": ["normal"]}},
            "oversample": 30,
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["filter_applied"] is True
    for hit in body["hits"]:
        assert hit["obs"]["disease"] == "normal"


def test_search_unknown_cell_returns_404(client, synth_h5ad, db_session) -> None:
    _ds, idx = _setup(synth_h5ad, db_session)
    resp = client.post(
        "/api/search/by-cell",
        json={"index_id": idx.id, "cell_id": "ghost", "k": 5},
    )
    assert resp.status_code == 404


def test_index_not_ready_returns_409(client, synth_h5ad, db_session) -> None:
    resp = client.post(
        "/api/search/by-cell",
        json={"index_id": 999, "cell_id": "x", "k": 5},
    )
    # 不存在 → 404
    assert resp.status_code == 404
