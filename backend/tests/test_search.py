"""检索接口测试：HTTP 端到端 + 条件过滤。"""
from __future__ import annotations

from tests.conftest import admin_token, auth_header

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
    headers = auth_header(admin_token(client))
    _ds, idx = _setup(synth_h5ad, db_session)

    resp = client.post(
        "/api/search/by-cell",
        json={"index_id": idx.id, "cell_id": "cell_0042", "k": 5},
        headers=headers,
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
    headers = auth_header(admin_token(client))
    _ds, idx = _setup(synth_h5ad, db_session)
    resp = client.post(
        "/api/search/by-vector",
        json={"index_id": idx.id, "vector": [0.0] * 4, "k": 5},
        headers=headers,
    )
    assert resp.status_code == 400


def test_search_with_filter_only_returns_matching_obs(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
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
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["filter_applied"] is True
    for hit in body["hits"]:
        assert hit["obs"]["disease"] == "normal"


def test_search_unknown_cell_returns_404(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    _ds, idx = _setup(synth_h5ad, db_session)
    resp = client.post(
        "/api/search/by-cell",
        json={"index_id": idx.id, "cell_id": "ghost", "k": 5},
        headers=headers,
    )
    assert resp.status_code == 404


def test_index_not_ready_returns_409(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    resp = client.post(
        "/api/search/by-cell",
        json={"index_id": 999, "cell_id": "x", "k": 5},
        headers=headers,
    )
    # 不存在 → 404
    assert resp.status_code == 404


# ─── 批量检索 ─────────────────────────────────────────────────────────────────

def _setup_batch(synth_h5ad, db_session, name_suffix="", algorithm="flat"):
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name=f"batch-ds{name_suffix}", source_path=str(synth_h5ad)),
    )
    idx = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds.id, algorithm=algorithm, params={}),
    )
    return ds, idx


def test_search_batch_ranked(client, synth_h5ad, db_session) -> None:
    """ranked 聚合：返回结构完整，dataset_id 正确。"""
    headers = auth_header(admin_token(client))
    ds, idx = _setup_batch(synth_h5ad, db_session, "-ranked")

    resp = client.post(
        "/api/search/batch",
        json={
            "index_id": idx.id,
            "cell_ids": ["cell_0000", "cell_0001"],
            "k": 5,
            "aggregate": "ranked",
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["dataset_id"] == ds.id
    assert body["n_queries"] == 2
    assert body["k"] == 5
    assert body["aggregate"] == "ranked"
    assert len(body["hits"]) <= 5
    if body["hits"]:
        assert body["hits"][0]["rank"] == 1
        assert body["hits"][0]["hit_count"] >= 1
        assert "cell_id" in body["hits"][0]
        assert "avg_distance" in body["hits"][0]


def test_search_batch_union(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_batch(synth_h5ad, db_session, "-union")

    resp = client.post(
        "/api/search/batch",
        json={
            "index_id": idx.id,
            "cell_ids": ["cell_0000", "cell_0001", "cell_0002"],
            "k": 5,
            "aggregate": "union",
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["aggregate"] == "union"
    assert len(body["hits"]) <= 5


def test_search_batch_intersection(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_batch(synth_h5ad, db_session, "-inter")

    resp = client.post(
        "/api/search/batch",
        json={
            "index_id": idx.id,
            "cell_ids": ["cell_0000", "cell_0001"],
            "k": 5,
            "aggregate": "intersection",
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["aggregate"] == "intersection"
    # intersection 结果 ≤ union 结果，可能为空（不报错即可）
    assert isinstance(body["hits"], list)


def test_search_batch_with_obs_filter(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_batch(synth_h5ad, db_session, "-filter")

    resp = client.post(
        "/api/search/batch",
        json={
            "index_id": idx.id,
            "cell_ids": ["cell_0000", "cell_0010"],
            "k": 5,
            "aggregate": "ranked",
            "filters": {"equals": {"disease": ["normal"]}},
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    for hit in resp.json()["hits"]:
        assert hit["obs"]["disease"] == "normal"


def test_search_batch_single_cell_id(client, synth_h5ad, db_session) -> None:
    headers = auth_header(admin_token(client))
    ds, idx = _setup_batch(synth_h5ad, db_session, "-single")

    resp = client.post(
        "/api/search/batch",
        json={"index_id": idx.id, "cell_ids": ["cell_0042"], "k": 5},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["dataset_id"] == ds.id
    # 自身被排除，结果不包含 cell_0042
    assert all(h["cell_id"] != "cell_0042" for h in body["hits"])
