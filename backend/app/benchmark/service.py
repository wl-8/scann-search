"""性能评测核心逻辑。

跑批协议：
1. 取数据集向量。
2. 用 seed 抽 n_queries 条作为查询集（自身在结果里会被剔除）。
3. 用 FlatL2 暴力检索得到 ground truth top-k。
4. 对每个 (algorithm, params)：构建索引 → 计时 → 跑所有查询 → 算 recall@k / 延迟分布 / QPS / 索引体积。
5. 写一行 BenchmarkBatch + N 行 BenchmarkResult。

为什么不直接复用已有的 Index 表？
- benchmark 跑的索引是临时的（评测完即可丢），混进 Index 表会污染"用户/管理员可见"的索引列表。
- benchmark 的指标含 recall，是 Index 表没有的字段。
"""
from __future__ import annotations

import logging
import time
from pathlib import Path

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ann.base import BaseANNIndex
from app.ann.factory import SUPPORTED_ALGORITHMS, create_index
from app.benchmark.exceptions import BenchmarkBatchNotFound, BenchmarkResultNotFound
from app.benchmark.models import BenchmarkBatch, BenchmarkResult
from app.benchmark.schemas import AlgorithmConfig, BenchmarkRunRequest
from app.core.config import settings
from app.datasets import service as ds_service
from app.index import constants as idx_const
from app.index.exceptions import UnsupportedAlgorithm

logger = logging.getLogger(__name__)

GROUND_TRUTH_ALGO = idx_const.ALGO_FLAT


def run(db: Session, req: BenchmarkRunRequest) -> BenchmarkBatch:
    for cfg in req.algorithms:
        if cfg.algorithm not in SUPPORTED_ALGORITHMS:
            raise UnsupportedAlgorithm(cfg.algorithm, SUPPORTED_ALGORITHMS)

    ds = ds_service.get_ready(db, req.dataset_id)
    vectors = ds_service.load_vectors(ds)
    n_total = vectors.shape[0]
    n_queries = min(req.n_queries, n_total)

    rng = np.random.default_rng(req.seed)
    query_rows = rng.choice(n_total, size=n_queries, replace=False).astype(np.int64)
    queries = vectors[query_rows]

    # ground truth: FlatL2，多取 1 个用于剔除查询自身
    gt_index = create_index(GROUND_TRUTH_ALGO, dim=vectors.shape[1])
    gt_index.build(vectors)
    truth_raw = _query_all(gt_index, queries, k=req.k + 1)
    truth_topk = _drop_self(truth_raw, query_rows, k=req.k)

    label = req.label.strip() or _default_label(req.dataset_id, req.algorithms)

    batch = BenchmarkBatch(
        label=label,
        dataset_id=ds.id,
        k=req.k,
        n_queries=int(queries.shape[0]),
        seed=req.seed,
    )
    db.add(batch)
    db.flush()  # 获取 batch.id，后续结果行引用它

    for cfg in req.algorithms:
        result = _benchmark_one(
            batch_id=batch.id,
            cfg=cfg,
            vectors=vectors,
            queries=queries,
            query_rows=query_rows,
            truth_topk=truth_topk,
            k=req.k,
        )
        db.add(result)

    db.commit()
    db.refresh(batch)
    return batch


def list_batches(
    db: Session,
    dataset_id: int | None = None,
    label: str | None = None,
) -> list[BenchmarkBatch]:
    stmt = select(BenchmarkBatch).order_by(BenchmarkBatch.id.desc())
    if dataset_id is not None:
        stmt = stmt.where(BenchmarkBatch.dataset_id == dataset_id)
    if label:
        stmt = stmt.where(BenchmarkBatch.label.contains(label))
    return list(db.scalars(stmt))


def get_batch(db: Session, batch_id: int) -> BenchmarkBatch:
    obj = db.get(BenchmarkBatch, batch_id)
    if obj is None:
        raise BenchmarkBatchNotFound(batch_id)
    return obj


def delete_batch(db: Session, batch_id: int) -> None:
    obj = db.get(BenchmarkBatch, batch_id)
    if obj is None:
        raise BenchmarkBatchNotFound(batch_id)
    db.delete(obj)
    db.commit()


def get_result(db: Session, result_id: int) -> BenchmarkResult:
    obj = db.get(BenchmarkResult, result_id)
    if obj is None:
        raise BenchmarkResultNotFound(result_id)
    return obj


def get_batches_for_export(db: Session, batch_ids: list[int]) -> list[BenchmarkBatch]:
    """按 id 列表获取多批，保持传入顺序，缺失的批次直接跳过（不报错）。"""
    rows = list(db.scalars(select(BenchmarkBatch).where(BenchmarkBatch.id.in_(batch_ids))))
    id_order = {bid: i for i, bid in enumerate(batch_ids)}
    return sorted(rows, key=lambda b: id_order.get(b.id, 999))


# ---------- 内部 ----------

def _default_label(dataset_id: int, algorithms: list[AlgorithmConfig]) -> str:
    algos = [a.algorithm for a in algorithms]
    if len(algos) <= 3:
        algo_str = "+".join(algos)
    else:
        algo_str = "+".join(algos[:3]) + f"+{len(algos) - 3}more"
    return f"ds{dataset_id}_{algo_str}"


def _benchmark_one(
    batch_id: int,
    cfg: AlgorithmConfig,
    vectors: np.ndarray,
    queries: np.ndarray,
    query_rows: np.ndarray,
    truth_topk: list[set[int]],
    k: int,
) -> BenchmarkResult:
    index = create_index(cfg.algorithm, dim=vectors.shape[1], **cfg.params)

    t0 = time.perf_counter()
    index.build(vectors)
    build_ms = (time.perf_counter() - t0) * 1000.0

    # 临时落盘以测体积；测完即删
    tmp_path = Path(settings.INDEX_DIR) / f"_bench_{batch_id}_{cfg.algorithm}.bin"
    tmp_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        index.save(str(tmp_path))
        index_size = _size_with_sidecars(tmp_path)
    finally:
        for p in [tmp_path, tmp_path.with_suffix(tmp_path.suffix + ".ids.npy")]:
            p.unlink(missing_ok=True)

    fetch_k = k + 1
    latencies_ms: list[float] = []
    hits_per_query: list[set[int]] = []
    for qi, q in enumerate(queries):
        t1 = time.perf_counter()
        rows, _ = index.search(q, k=fetch_k)
        latencies_ms.append((time.perf_counter() - t1) * 1000.0)
        rows = [r for r in rows if r != int(query_rows[qi])][:k]
        hits_per_query.append(set(rows))

    recall = _recall_at_k(hits_per_query, truth_topk)
    lat_arr = np.asarray(latencies_ms, dtype=np.float64)
    qps = 1000.0 / lat_arr.mean() if lat_arr.mean() > 0 else float("inf")

    logger.info(
        "benchmark batch=%d/%s: recall@%d=%.4f avg=%.2fms p95=%.2fms qps=%.0f",
        batch_id, cfg.algorithm, k, recall, lat_arr.mean(), np.percentile(lat_arr, 95), qps,
    )
    return BenchmarkResult(
        batch_id=batch_id,
        algorithm=cfg.algorithm,
        params=dict(cfg.params),
        recall_at_k=float(recall),
        avg_latency_ms=float(lat_arr.mean()),
        p50_latency_ms=float(np.percentile(lat_arr, 50)),
        p95_latency_ms=float(np.percentile(lat_arr, 95)),
        p99_latency_ms=float(np.percentile(lat_arr, 99)),
        qps=float(qps),
        build_time_ms=float(build_ms),
        index_size_bytes=int(index_size),
    )


def _query_all(index: BaseANNIndex, queries: np.ndarray, k: int) -> list[list[int]]:
    return [index.search(q, k=k)[0] for q in queries]


def _drop_self(neighbors: list[list[int]], query_rows: np.ndarray, k: int) -> list[set[int]]:
    return [
        set([r for r in rows if r != qr][:k])
        for rows, qr in zip(neighbors, query_rows.tolist())
    ]


def _recall_at_k(predicted: list[set[int]], truth: list[set[int]]) -> float:
    """micro-average recall@k = sum(|pred ∩ truth|) / sum(|truth|)。"""
    inter = sum(len(p & t) for p, t in zip(predicted, truth))
    denom = sum(len(t) for t in truth)
    return inter / denom if denom > 0 else 0.0


def _size_with_sidecars(path: Path) -> int:
    """FlatL2 索引保存时会额外写 .ids.npy，要算进去。"""
    total = path.stat().st_size if path.exists() else 0
    sidecar = path.with_suffix(path.suffix + ".ids.npy")
    if sidecar.exists():
        total += sidecar.stat().st_size
    return total
