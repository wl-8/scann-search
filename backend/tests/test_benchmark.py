"""集成测试：性能评测（多算法对比）。

只验证：跑通、产出条数正确、recall@k 落在合理区间、QPS > 0。
不验证绝对延迟数字（与机器有关）。
"""
from __future__ import annotations

from app.benchmark import service as bench_service
from app.benchmark.schemas import AlgorithmConfig, BenchmarkRunRequest
from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest


def test_benchmark_compares_flat_and_hnsw(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-ds", source_path=str(synth_h5ad)),
    )
    rows = bench_service.run(
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
    assert len(rows) == 2
    by_algo = {r.algorithm: r for r in rows}

    # Flat 的 recall 必须 = 1.0（它就是 ground truth）
    assert by_algo["flat"].recall_at_k == 1.0
    # HNSW 在合成簇数据上 recall 应该很高
    assert by_algo["hnsw"].recall_at_k >= 0.9

    for r in rows:
        assert r.k == 10
        assert r.n_queries == 30
        assert r.avg_latency_ms > 0
        assert r.qps > 0
        assert r.index_size_bytes > 0
        assert r.batch_id  # 非空

    # 同一批次共享 batch_id
    assert by_algo["flat"].batch_id == by_algo["hnsw"].batch_id


def test_benchmark_persisted_and_queryable_by_batch(synth_h5ad, db_session) -> None:
    ds = ds_service.register(
        db_session,
        DatasetRegisterRequest(name="bench-batch", source_path=str(synth_h5ad)),
    )
    rows = bench_service.run(
        db_session,
        BenchmarkRunRequest(
            dataset_id=ds.id,
            algorithms=[AlgorithmConfig(algorithm="hnsw", params={})],
            k=5,
            n_queries=10,
        ),
    )
    batch_id = rows[0].batch_id

    fetched = bench_service.list_batch(db_session, batch_id)
    assert len(fetched) == 1
    assert fetched[0].algorithm == "hnsw"
