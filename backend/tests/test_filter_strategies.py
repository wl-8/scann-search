"""过滤策略对比测试。

覆盖三层：
1. strategies 模块单测（不走 HTTP / DB）：在内存里造小数据，验证三个函数行为
2. service.compare_strategies 集成测：经过真实索引 + obs
3. HTTP 端到端：/api/search/compare-strategies
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from app.ann.factory import create_index
from app.ann.hnsw import HNSWIndex
from app.search import strategies as strat
from app.search.schemas import SearchFilter


# ─── strategies 模块单测 ─────────────────────────────────────────────────────

def _make_data(seed: int = 0, n: int = 300, d: int = 8, n_clusters: int = 3):
    rng = np.random.default_rng(seed)
    centers = rng.normal(scale=3.0, size=(n_clusters, d)).astype(np.float32)
    labels = rng.integers(0, n_clusters, size=n)
    X = (centers[labels] + rng.normal(scale=0.5, size=(n, d))).astype(np.float32)
    obs = pd.DataFrame({
        "cell_type": [f"Type{labels[i]}" for i in range(n)],
        "disease": ["normal" if i % 5 else "diseased" for i in range(n)],
        "n_counts": rng.integers(100, 1000, size=n),
    }, index=[f"cell_{i:04d}" for i in range(n)])
    return X, obs


def test_compute_allowed_rows_equals_only() -> None:
    _X, obs = _make_data()
    f = SearchFilter(equals={"cell_type": ["Type0"]})
    rows = strat.compute_allowed_rows(obs, f)
    assert (obs.iloc[rows]["cell_type"] == "Type0").all()
    assert rows.size > 0


def test_compute_allowed_rows_combined() -> None:
    _X, obs = _make_data()
    f = SearchFilter(
        equals={"disease": ["normal"]},
        gte={"n_counts": 500.0},
    )
    rows = strat.compute_allowed_rows(obs, f)
    sub = obs.iloc[rows]
    assert (sub["disease"] == "normal").all()
    assert (sub["n_counts"] >= 500).all()


def test_compute_allowed_rows_unknown_column_returns_empty() -> None:
    _X, obs = _make_data()
    f = SearchFilter(equals={"nonexistent": ["x"]})
    rows = strat.compute_allowed_rows(obs, f)
    assert rows.size == 0


def test_pre_filter_returns_only_matching_rows() -> None:
    X, obs = _make_data()
    f = SearchFilter(equals={"cell_type": ["Type1"]})
    out = strat.pre_filter_search(
        vectors=X, obs=obs, query_vec=X[0], k=10, filters=f, exclude_row=0,
    )
    assert len(out.rows) == 10
    for r in out.rows:
        assert obs.iloc[r]["cell_type"] == "Type1"
        assert r != 0
    # 距离已升序
    assert out.distances == sorted(out.distances)


def test_post_filter_low_selectivity_may_return_less_than_k() -> None:
    """构造一个**极罕见**类别，让 post-filter 召回不足。"""
    rng = np.random.default_rng(1)
    n, d = 300, 8
    X = rng.standard_normal(size=(n, d)).astype(np.float32)
    # 只有 5 个 "rare" 细胞，且不集中分布
    cell_types = ["common"] * (n - 5) + ["rare"] * 5
    rng.shuffle(cell_types)
    obs = pd.DataFrame({"cell_type": cell_types}, index=[f"c{i}" for i in range(n)])

    index = create_index("hnsw", dim=d, ef_search=64)
    index.build(X)

    f = SearchFilter(equals={"cell_type": ["rare"]})
    out = strat.post_filter_search(
        ann_index=index, query_vec=X[0], k=10, filters=f,
        obs=obs, n_total=n, oversample=10, exclude_row=0,
    )
    # 5 个 rare 里去掉查询自身（如果是 rare）后最多 5 个；post 大概率拿不到 10 个
    assert len(out.rows) <= 5
    for r in out.rows:
        assert obs.iloc[r]["cell_type"] == "rare"


def test_pre_filter_recovers_what_post_filter_misses() -> None:
    """在同一个低选择度场景下，pre 能拿全，post 不能 —— 这是策略对比的核心卖点。"""
    rng = np.random.default_rng(2)
    n, d = 300, 8
    X = rng.standard_normal(size=(n, d)).astype(np.float32)
    cell_types = ["common"] * (n - 8) + ["rare"] * 8
    rng.shuffle(cell_types)
    obs = pd.DataFrame({"cell_type": cell_types}, index=[f"c{i}" for i in range(n)])

    index = create_index("hnsw", dim=d, ef_search=64)
    index.build(X)
    f = SearchFilter(equals={"cell_type": ["rare"]})

    post = strat.post_filter_search(
        ann_index=index, query_vec=X[0], k=8, filters=f,
        obs=obs, n_total=n, oversample=5, exclude_row=0,
    )
    pre = strat.pre_filter_search(
        vectors=X, obs=obs, query_vec=X[0], k=8, filters=f, exclude_row=0,
    )
    # pre 一定拿到所有的 rare（除了查询自身可能也是 rare）
    assert len(pre.rows) >= 7
    # post 很可能少于 pre
    assert len(post.rows) <= len(pre.rows)


def test_hybrid_hnsw_filter_returns_only_matching() -> None:
    X, obs = _make_data()
    index = create_index("hnsw", dim=X.shape[1], ef_search=128)
    index.build(X)
    f = SearchFilter(equals={"cell_type": ["Type0"]})
    out = strat.hybrid_hnsw_search(
        ann_index=index, obs=obs, query_vec=X[0], k=10, filters=f,
        n_total=X.shape[0], exclude_row=0,
    )
    for r in out.rows:
        assert obs.iloc[r]["cell_type"] == "Type0"


def test_hybrid_rejects_non_hnsw_index() -> None:
    X, obs = _make_data()
    flat = create_index("flat", dim=X.shape[1])
    flat.build(X)
    f = SearchFilter(equals={"cell_type": ["Type0"]})
    with pytest.raises(TypeError):
        strat.hybrid_hnsw_search(
            ann_index=flat, obs=obs, query_vec=X[0], k=5, filters=f,
            n_total=X.shape[0], exclude_row=0,
        )


# ─── compare_strategies HTTP 端到端 ─────────────────────────────────────────

def _setup_index(synth_h5ad, db_session, algorithm: str = "hnsw"):
    from app.datasets import service as ds_service
    from app.datasets.schemas import DatasetRegisterRequest
    from app.index import service as idx_service
    from app.index.schemas import IndexBuildRequest

    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="compare-ds", source_path=str(synth_h5ad)),
    )
    idx = idx_service.build(
        db_session,
        IndexBuildRequest(dataset_id=ds.id, algorithm=algorithm, params={}),
    )
    return ds, idx


def test_compare_endpoint_returns_three_strategies(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_index(synth_h5ad, db_session, "hnsw")

    resp = client.post(
        "/api/search/compare-strategies",
        json={
            "index_id": idx.id,
            "cell_id": "cell_0042",
            "k": 5,
            "filters": {"equals": {"cell_type": ["Type0"]}},
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["k"] == 5
    assert 0.0 <= body["filter_selectivity"] <= 1.0
    names = {r["strategy"] for r in body["results"]}
    assert names == {"post", "pre", "hybrid"}

    by_name = {r["strategy"]: r for r in body["results"]}
    # pre 永远是 recall=1.0（自身作 ground truth）
    assert by_name["pre"]["recall_at_k"] == 1.0
    # pre 的命中里 cell_type 全部正确
    for h in by_name["pre"]["hits"]:
        assert h["obs"]["cell_type"] == "Type0"


def test_compare_endpoint_requires_non_empty_filters(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_index(synth_h5ad, db_session, "hnsw")

    resp = client.post(
        "/api/search/compare-strategies",
        json={
            "index_id": idx.id,
            "cell_id": "cell_0001",
            "k": 5,
            "filters": {"equals": {}},
        },
        headers=headers,
    )
    # Pydantic 校验失败 → 422
    assert resp.status_code == 422


def test_compare_endpoint_skips_hybrid_for_non_hnsw(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_index(synth_h5ad, db_session, "flat")

    resp = client.post(
        "/api/search/compare-strategies",
        json={
            "index_id": idx.id,
            "cell_id": "cell_0001",
            "k": 5,
            "filters": {"equals": {"cell_type": ["Type0"]}},
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    by_name = {r["strategy"]: r for r in body["results"]}
    # hybrid 对 flat 应该是占位（n_returned=0 + skipped_reason）
    assert by_name["hybrid"]["n_returned"] == 0
    assert "skipped_reason" in by_name["hybrid"]["extra"]


def test_compare_endpoint_accepts_vector_input(client, synth_h5ad, db_session) -> None:
    from tests.conftest import admin_token, auth_header
    headers = auth_header(admin_token(client))
    _ds, idx = _setup_index(synth_h5ad, db_session, "hnsw")

    resp = client.post(
        "/api/search/compare-strategies",
        json={
            "index_id": idx.id,
            "vector": [0.0] * 16,
            "k": 3,
            "filters": {"equals": {"cell_type": ["Type1"]}},
            "strategies": ["post", "pre"],
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert {r["strategy"] for r in body["results"]} == {"post", "pre"}
