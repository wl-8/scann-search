"""集成测试：性能评测（多算法对比）。

只验证：跑通、产出条数正确、recall@k 落在合理区间、QPS > 0。
不验证绝对延迟数字（与机器有关）。
"""
from __future__ import annotations

import pytest

from app.benchmark import service as bench_service
from app.benchmark.exceptions import BenchmarkBatchNotFound
from app.benchmark.schemas import AlgorithmConfig, BenchmarkRunRequest
from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from tests.conftest import admin_token, auth_header, login, register


# ─── service 层 ───────────────────────────────────────────────────────────────

def test_benchmark_compares_flat_and_hnsw(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-ds", source_path=str(synth_h5ad)),
    )
    batch = bench_service.run(
        db_session,
        BenchmarkRunRequest(
            dataset_id=ds.id,
            algorithms=[
                AlgorithmConfig(algorithm="flat", params={}),
                AlgorithmConfig(algorithm="hnsw", params={"ef_search": 64}),
            ],
            k=10,
            n_queries=30,
            seed=7,
        ),
    )
    assert len(batch.results) == 2
    by_algo = {r.algorithm: r for r in batch.results}

    assert by_algo["flat"].recall_at_k == 1.0
    assert by_algo["hnsw"].recall_at_k >= 0.9

    for r in batch.results:
        assert r.avg_latency_ms > 0
        assert r.qps > 0
        assert r.index_size_bytes > 0
        assert r.batch_id == batch.id

    assert by_algo["flat"].batch_id == by_algo["hnsw"].batch_id


def test_benchmark_persisted_and_queryable_by_batch(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-batch", source_path=str(synth_h5ad)),
    )
    batch = bench_service.run(
        db_session,
        BenchmarkRunRequest(
            dataset_id=ds.id,
            algorithms=[AlgorithmConfig(algorithm="hnsw", params={})],
            k=5,
            n_queries=10,
        ),
    )

    fetched = bench_service.get_batch(db_session, batch.id)
    assert len(fetched.results) == 1
    assert fetched.results[0].algorithm == "hnsw"


def test_default_label_generated(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-label", source_path=str(synth_h5ad)),
    )
    batch = bench_service.run(
        db_session,
        BenchmarkRunRequest(
            dataset_id=ds.id,
            algorithms=[AlgorithmConfig(algorithm="flat")],
            k=5, n_queries=10,
        ),
    )
    assert batch.label.startswith(f"ds{ds.id}_")
    assert "flat" in batch.label


def test_custom_label_preserved(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-custom-label", source_path=str(synth_h5ad)),
    )
    batch = bench_service.run(
        db_session,
        BenchmarkRunRequest(
            dataset_id=ds.id,
            label="my-experiment-1",
            algorithms=[AlgorithmConfig(algorithm="flat")],
            k=5, n_queries=10,
        ),
    )
    assert batch.label == "my-experiment-1"


def test_list_batches_label_filter(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-filter", source_path=str(synth_h5ad)),
    )
    bench_service.run(db_session, BenchmarkRunRequest(
        dataset_id=ds.id, label="exp-alpha",
        algorithms=[AlgorithmConfig(algorithm="flat")], k=5, n_queries=10,
    ))
    bench_service.run(db_session, BenchmarkRunRequest(
        dataset_id=ds.id, label="exp-beta",
        algorithms=[AlgorithmConfig(algorithm="flat")], k=5, n_queries=10,
    ))

    all_batches = bench_service.list_batches(db_session, dataset_id=ds.id)
    assert len(all_batches) == 2

    filtered = bench_service.list_batches(db_session, label="alpha")
    assert len(filtered) == 1
    assert filtered[0].label == "exp-alpha"


def test_delete_batch_cascades(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-del", source_path=str(synth_h5ad)),
    )
    batch = bench_service.run(db_session, BenchmarkRunRequest(
        dataset_id=ds.id,
        algorithms=[AlgorithmConfig(algorithm="flat")],
        k=5, n_queries=10,
    ))
    result_id = batch.results[0].id
    batch_id = batch.id

    bench_service.delete_batch(db_session, batch_id)

    with pytest.raises(BenchmarkBatchNotFound):
        bench_service.get_batch(db_session, batch_id)

    from app.benchmark.exceptions import BenchmarkResultNotFound
    with pytest.raises(BenchmarkResultNotFound):
        bench_service.get_result(db_session, result_id)


def test_get_nonexistent_batch_raises(db_session) -> None:
    with pytest.raises(BenchmarkBatchNotFound):
        bench_service.get_batch(db_session, 99999)


def test_delete_nonexistent_batch_raises(db_session) -> None:
    with pytest.raises(BenchmarkBatchNotFound):
        bench_service.delete_batch(db_session, 99999)


# ─── HTTP 层辅助 ──────────────────────────────────────────────────────────────

def _find_user_id(client, token, username: str) -> int:
    r = client.get("/api/users", headers=auth_header(token))
    for u in r.json()["items"]:
        if u["username"] == username:
            return u["id"]
    raise ValueError(f"user {username} not found")


def _regular_token(client) -> str:
    register(client, username="bm_user", email="bm_user@test.com", password="Test@1234")
    token = admin_token(client)
    uid = _find_user_id(client, token, "bm_user")
    client.post(f"/api/users/{uid}/approve", headers=auth_header(token))
    return login(client, username="bm_user", password="Test@1234").json()["access_token"]


def _run_batch_via_api(client, synth_h5ad, token, label="", ds_name=None):
    r = client.post("/api/datasets/register", json={
        "name": ds_name or f"bm-http-{label or 'x'}",
        "source_path": str(synth_h5ad),
    }, headers=auth_header(token))
    assert r.status_code == 200
    ds_id = r.json()["id"]

    r = client.post("/api/benchmark/run", json={
        "dataset_id": ds_id,
        "label": label,
        "algorithms": [{"algorithm": "flat"}],
        "k": 5,
        "n_queries": 10,
    }, headers=auth_header(token))
    assert r.status_code == 201
    return r.json()


# ─── HTTP 层 ──────────────────────────────────────────────────────────────────

def test_http_run_and_get_batch(client, synth_h5ad) -> None:
    token = admin_token(client)
    batch = _run_batch_via_api(client, synth_h5ad, token, label="http-test")

    r = client.get(f"/api/benchmark/batches/{batch['id']}", headers=auth_header(token))
    assert r.status_code == 200
    data = r.json()
    assert data["label"] == "http-test"
    assert len(data["results"]) == 1


def test_http_list_batches_label_filter(client, synth_h5ad) -> None:
    token = admin_token(client)
    b1 = _run_batch_via_api(client, synth_h5ad, token, label="run-A", ds_name="ds-list-a")
    _run_batch_via_api(client, synth_h5ad, token, label="run-B", ds_name="ds-list-b")

    r = client.get("/api/benchmark/batches", params={"label": "run-A"}, headers=auth_header(token))
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["id"] == b1["id"]


def test_http_list_batches_dataset_filter(client, synth_h5ad) -> None:
    token = admin_token(client)

    r = client.post("/api/datasets/register", json={
        "name": "ds-filter-x", "source_path": str(synth_h5ad),
    }, headers=auth_header(token))
    ds_x = r.json()["id"]

    r = client.post("/api/datasets/register", json={
        "name": "ds-filter-y", "source_path": str(synth_h5ad),
    }, headers=auth_header(token))
    ds_y = r.json()["id"]

    for algo in ["flat"]:
        client.post("/api/benchmark/run", json={
            "dataset_id": ds_x, "algorithms": [{"algorithm": algo}], "k": 5, "n_queries": 10,
        }, headers=auth_header(token))
        client.post("/api/benchmark/run", json={
            "dataset_id": ds_y, "algorithms": [{"algorithm": algo}], "k": 5, "n_queries": 10,
        }, headers=auth_header(token))

    r = client.get("/api/benchmark/batches", params={"dataset_id": ds_x}, headers=auth_header(token))
    assert r.status_code == 200
    items = r.json()
    assert all(item["dataset_id"] == ds_x for item in items)
    assert len(items) == 1


def test_http_delete_batch(client, synth_h5ad) -> None:
    token = admin_token(client)
    batch = _run_batch_via_api(client, synth_h5ad, token, ds_name="ds-del-http")

    r = client.delete(f"/api/benchmark/batches/{batch['id']}", headers=auth_header(token))
    assert r.status_code == 204

    r = client.get(f"/api/benchmark/batches/{batch['id']}", headers=auth_header(token))
    assert r.status_code == 404


def test_http_delete_nonexistent_batch_returns_404(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.delete("/api/benchmark/batches/99999", headers=auth_header(token))
    assert r.status_code == 404


def test_http_get_nonexistent_batch_returns_404(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.get("/api/benchmark/batches/99999", headers=auth_header(token))
    assert r.status_code == 404


def test_http_get_nonexistent_result_returns_404(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.get("/api/benchmark/results/99999", headers=auth_header(token))
    assert r.status_code == 404


def test_http_get_result(client, synth_h5ad) -> None:
    token = admin_token(client)
    batch = _run_batch_via_api(client, synth_h5ad, token, ds_name="ds-result")
    result_id = batch["results"][0]["id"]

    r = client.get(f"/api/benchmark/results/{result_id}", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["algorithm"] == "flat"


def test_http_run_forbidden_for_regular_user(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.post("/api/datasets/register", json={
        "name": "ds-auth-bm", "source_path": str(synth_h5ad),
    }, headers=auth_header(token))
    ds_id = r.json()["id"]

    user_token = _regular_token(client)
    r = client.post("/api/benchmark/run", json={
        "dataset_id": ds_id,
        "algorithms": [{"algorithm": "flat"}],
        "k": 5, "n_queries": 10,
    }, headers=auth_header(user_token))
    assert r.status_code == 403


def test_http_delete_forbidden_for_regular_user(client, synth_h5ad) -> None:
    token = admin_token(client)
    batch = _run_batch_via_api(client, synth_h5ad, token, ds_name="ds-del-auth")

    user_token = _regular_token(client)
    r = client.delete(f"/api/benchmark/batches/{batch['id']}", headers=auth_header(user_token))
    assert r.status_code == 403
