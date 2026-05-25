"""单元测试：ANN 算法实现。

目标：
- FlatL2 在合成簇数据上 recall@10 = 1.0（自身就是 ground truth）
- HNSW 在合成簇数据上 recall@10 ≥ 0.95
- save / load 之后检索结果一致
- add / remove 行为正确
"""
from __future__ import annotations

import numpy as np
import pytest

from app.ann.factory import SUPPORTED_ALGORITHMS, create_index


def _make_data(seed: int = 0, n: int = 500, d: int = 16, n_clusters: int = 5):
    rng = np.random.default_rng(seed)
    centers = rng.normal(scale=3.0, size=(n_clusters, d)).astype(np.float32)
    labels = rng.integers(0, n_clusters, size=n)
    X = (centers[labels] + rng.normal(scale=0.5, size=(n, d))).astype(np.float32)
    return X


def _ground_truth(vectors: np.ndarray, queries: np.ndarray, k: int) -> list[set[int]]:
    dists = ((vectors[None, :, :] - queries[:, None, :]) ** 2).sum(axis=-1)
    topk = np.argsort(dists, axis=1)[:, :k]
    return [set(row.tolist()) for row in topk]


def _recall(pred: list[set[int]], truth: list[set[int]]) -> float:
    inter = sum(len(p & t) for p, t in zip(pred, truth))
    denom = sum(len(t) for t in truth)
    return inter / denom


FAISS_ALGORITHMS = ["lsh", "ivf", "pq", "opq", "ivf_pq", "ivf_hnsw"]
ALL_ALGORITHMS = ["flat", "hnsw", *FAISS_ALGORITHMS]


def _small_params(algorithm: str) -> dict[str, int]:
    if algorithm in {"ivf", "ivf_pq", "ivf_hnsw"}:
        return {"nlist": 32, "nprobe": 8, "m": 4, "nbits": 4, "M": 8}
    if algorithm in {"pq", "opq"}:
        return {"m": 4, "nbits": 4, "niter": 2}
    if algorithm == "lsh":
        return {"nbits": 32}
    return {}


def test_supported_algorithms_includes_expected_backend_indexes() -> None:
    assert tuple(ALL_ALGORITHMS) == SUPPORTED_ALGORITHMS


def test_flat_recall_is_perfect() -> None:
    X = _make_data()
    queries = X[:20]
    truth = _ground_truth(X, queries, k=10)

    index = create_index("flat", dim=X.shape[1])
    index.build(X)

    pred = [set(index.search(q, k=10)[0]) for q in queries]
    assert _recall(pred, truth) == 1.0


def test_hnsw_recall_high() -> None:
    X = _make_data()
    queries = X[:20]
    truth = _ground_truth(X, queries, k=10)

    index = create_index("hnsw", dim=X.shape[1], M=16, ef_construction=200, ef_search=64)
    index.build(X)

    pred = [set(index.search(q, k=10)[0]) for q in queries]
    assert _recall(pred, truth) >= 0.95


@pytest.mark.parametrize("algorithm", ALL_ALGORITHMS)
def test_save_load_roundtrip(tmp_path, algorithm) -> None:
    X = _make_data()
    queries = X[:10]
    dim = X.shape[1]
    params = _small_params(algorithm)

    a = create_index(algorithm, dim=dim, **params)
    a.build(X)
    expected = [a.search(q, k=5) for q in queries]

    path = tmp_path / f"idx_{algorithm}.bin"
    a.save(str(path))

    b = create_index(algorithm, dim=dim, **params)
    b.load(str(path))

    actual = [b.search(q, k=5) for q in queries]
    for (ei, ed), (ai, ad_) in zip(expected, actual):
        assert ei == ai
        assert np.allclose(ed, ad_, atol=1e-4)


@pytest.mark.parametrize("algorithm", FAISS_ALGORITHMS)
def test_faiss_algorithms_build_search_save_load_on_small_data(tmp_path, algorithm) -> None:
    X = _make_data(n=45)
    dim = X.shape[1]
    params = _small_params(algorithm)

    index = create_index(algorithm, dim=dim, **params)
    index.build(X)

    rows, distances = index.search(X[0], k=10)
    assert len(rows) == 10
    assert len(distances) == 10
    assert set(rows).issubset(set(range(X.shape[0])))

    path = tmp_path / f"small_{algorithm}.bin"
    index.save(str(path))
    loaded = create_index(algorithm, dim=dim, **params)
    loaded.load(str(path))

    loaded_rows, loaded_distances = loaded.search(X[1], k=10)
    assert len(loaded_rows) == 10
    assert len(loaded_distances) == 10


@pytest.mark.parametrize("algorithm", ALL_ALGORITHMS)
def test_query_dim_mismatch_raises(algorithm) -> None:
    X = _make_data(d=16)
    index = create_index(algorithm, dim=16, **_small_params(algorithm))
    index.build(X)

    bad_query = np.zeros(8, dtype=np.float32)
    with pytest.raises(ValueError):
        index.search(bad_query, k=5)


@pytest.mark.parametrize("algorithm", ALL_ALGORITHMS)
def test_search_before_build_raises(algorithm) -> None:
    index = create_index(algorithm, dim=16, **_small_params(algorithm))
    with pytest.raises(RuntimeError):
        index.search(np.zeros(16, dtype=np.float32), k=5)


def test_hnsw_add_increases_ntotal() -> None:
    X = _make_data()
    index = create_index("hnsw", dim=X.shape[1])
    index.build(X[:300])
    assert index.ntotal == 300  # type: ignore[attr-defined]
    index.add(X[300:], ids=list(range(300, X.shape[0])))
    assert index.ntotal == X.shape[0]  # type: ignore[attr-defined]


def test_hnsw_remove_then_search_skips_deleted() -> None:
    X = _make_data()
    index = create_index("hnsw", dim=X.shape[1], ef_search=128)
    index.build(X)

    q = X[0]
    rows, _ = index.search(q, k=5)
    assert 0 in rows

    index.remove([0])
    rows2, _ = index.search(q, k=5)
    assert 0 not in rows2


def test_unsupported_algorithm_raises() -> None:
    with pytest.raises(NotImplementedError):
        create_index("nonexistent", dim=8)
