"""性能评测核心逻辑。

跑批协议：
1. 取数据集向量。
2. 用 seed 抽 n_queries 条作为查询集（自身在结果里会被剔除）。
3. 用 FlatL2 暴力检索得到 ground truth top-k（这一步会自动注入 algorithms 列表前；如果用户已经选 flat 也只跑一次）。
4. 对每个 (algorithm, params)：构建索引 → 计时 → 跑所有查询 → 算 recall@k / 延迟分布 / QPS / 索引体积。
5. 一次性写库，同一 batch_id。

为什么不直接复用已有的 Index 表？
- benchmark 跑的索引是临时的（评测完即可丢），混进 Index 表会污染"用户/管理员可见"的索引列表。
- benchmark 的指标含 recall，是 Index 表没有的字段。
"""
from __future__ import annotations

import logging
import time
import uuid
from pathlib import Path

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ann.base import BaseANNIndex
from app.ann.factory import SUPPORTED_ALGORITHMS, create_index
from app.benchmark.exceptions import BenchmarkBatchNotFound, BenchmarkRunNotFound
from app.benchmark.models import BenchmarkRun
from app.benchmark.schemas import AlgorithmConfig, BenchmarkRunRequest
from app.core.config import settings
from app.datasets import service as ds_service
from app.index import constants as idx_const
from app.index.exceptions import UnsupportedAlgorithm

logger = logging.getLogger(__name__)

GROUND_TRUTH_ALGO = idx_const.ALGO_FLAT


def run(db: Session, req: BenchmarkRunRequest) -> list[BenchmarkRun]:
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
    excluded = set(query_rows.tolist())

    # 1) ground truth: 用 FlatL2 取 k+1（多取 1 个用于剔除查询自身）
    fetch_k = req.k + 1
    gt_index = create_index(GROUND_TRUTH_ALGO, dim=vectors.shape[1])
    gt_index.build(vectors)
    truth = _query_all(gt_index, queries, k=fetch_k)
    truth_topk = _drop_self(truth, query_rows, k=req.k)

    # 2) 逐算法评测
    batch_id = uuid.uuid4().hex[:12]
    out: list[BenchmarkRun] = []
    for cfg in req.algorithms:
        run_row = _benchmark_one(
            db=db,
            dataset_id=ds.id,
            batch_id=batch_id,
            cfg=cfg,
            vectors=vectors,
            queries=queries,
            query_rows=query_rows,
            truth_topk=truth_topk,
            k=req.k,
        )
        out.append(run_row)

    return out


def list_batch(db: Session, batch_id: str) -> list[BenchmarkRun]:
    rows = list(db.scalars(select(BenchmarkRun).where(BenchmarkRun.batch_id == batch_id)
                           .order_by(BenchmarkRun.id.asc())))
    if not rows:
        raise BenchmarkBatchNotFound(batch_id)
    return rows


def list_all(db: Session, dataset_id: int | None = None) -> list[BenchmarkRun]:
    stmt = select(BenchmarkRun).order_by(BenchmarkRun.id.desc())
    if dataset_id is not None:
        stmt = stmt.where(BenchmarkRun.dataset_id == dataset_id)
    return list(db.scalars(stmt))


def get_by_id(db: Session, run_id: int) -> BenchmarkRun:
    obj = db.get(BenchmarkRun, run_id)
    if obj is None:
        raise BenchmarkRunNotFound(run_id)
    return obj


# ---------- 内部 ----------

def _benchmark_one(
    db: Session,
    dataset_id: int,
    batch_id: str,
    cfg: AlgorithmConfig,
    vectors: np.ndarray,
    queries: np.ndarray,
    query_rows: np.ndarray,
    truth_topk: list[set[int]],
    k: int,
) -> BenchmarkRun:
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
            if p.exists():
                p.unlink(missing_ok=True)

    # 查询 + 计时
    latencies_ms: list[float] = []
    hits_per_query: list[set[int]] = []
    fetch_k = k + 1  # 多取 1 个用于剔除查询自身
    for qi, q in enumerate(queries):
        t1 = time.perf_counter()
        rows, _ = index.search(q, k=fetch_k)
        latencies_ms.append((time.perf_counter() - t1) * 1000.0)
        rows = [r for r in rows if r != int(query_rows[qi])][:k]
        hits_per_query.append(set(rows))

    recall = _recall_at_k(hits_per_query, truth_topk)
    lat_arr = np.asarray(latencies_ms, dtype=np.float64)
    qps = 1000.0 / lat_arr.mean() if lat_arr.mean() > 0 else float("inf")

    row = BenchmarkRun(
        dataset_id=dataset_id,
        batch_id=batch_id,
        algorithm=cfg.algorithm,
        params=dict(cfg.params),
        k=k,
        n_queries=int(queries.shape[0]),
        recall_at_k=float(recall),
        avg_latency_ms=float(lat_arr.mean()),
        p50_latency_ms=float(np.percentile(lat_arr, 50)),
        p95_latency_ms=float(np.percentile(lat_arr, 95)),
        p99_latency_ms=float(np.percentile(lat_arr, 99)),
        qps=float(qps),
        build_time_ms=float(build_ms),
        index_size_bytes=int(index_size),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    logger.info(
        "benchmark %s/%s: recall@%d=%.4f avg=%.2fms p95=%.2fms qps=%.0f",
        batch_id, cfg.algorithm, k, recall, lat_arr.mean(), np.percentile(lat_arr, 95), qps,
    )
    return row


def _query_all(index: BaseANNIndex, queries: np.ndarray, k: int) -> list[list[int]]:
    out = []
    for q in queries:
        rows, _ = index.search(q, k=k)
        out.append(rows)
    return out


def _drop_self(neighbors: list[list[int]], query_rows: np.ndarray, k: int) -> list[set[int]]:
    out: list[set[int]] = []
    for rows, qr in zip(neighbors, query_rows.tolist(), strict=True):
        filtered = [r for r in rows if r != qr][:k]
        out.append(set(filtered))
    return out


def _recall_at_k(predicted: list[set[int]], truth: list[set[int]]) -> float:
    """sum(|pred ∩ truth|) / sum(|truth|) —— micro-average。"""
    inter = 0
    denom = 0
    for p, t in zip(predicted, truth, strict=True):
        inter += len(p & t)
        denom += len(t)
    return inter / denom if denom > 0 else 0.0


def _size_with_sidecars(path: Path) -> int:
    """FlatL2 索引保存时会额外写 .ids.npy，要算进去。"""
    total = path.stat().st_size if path.exists() else 0
    sidecar = path.with_suffix(path.suffix + ".ids.npy")
    if sidecar.exists():
        total += sidecar.stat().st_size
    return total
