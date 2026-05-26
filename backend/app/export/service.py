"""导出逻辑：从缓存或数据库生成 CSV 字节流。

CSV 排版原则：
- 检索结果 / 过滤结果：首行注释说明来源，然后标准列头 + 数据行。
- Benchmark 结果：纯表格（多批合并），batch 元信息作为前几列便于区分。
"""
from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import Iterator

from sqlalchemy.orm import Session

from app.datasets import service as ds_service
from app.export.cache import filter_cache, search_cache


def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------- 检索结果导出 ----------

def search_csv_rows(user_id: int) -> Iterator[str]:
    """流式生成检索结果 CSV。"""
    resp = search_cache[user_id]

    buf = io.StringIO()
    w = csv.writer(buf)

    # 注释头
    w.writerow([f"# ANN Search Export — {_now_utc()}"])
    w.writerow([
        f"# index_id={resp.index_id}  dataset_id={resp.dataset_id}"
        f"  algorithm={resp.algorithm}  metric={resp.metric}"
    ])
    w.writerow([
        f"# k={resp.k}  returned={resp.n_returned}"
        f"  latency_ms={resp.latency_ms:.2f}  filter={'yes' if resp.filter_applied else 'no'}"
    ])
    yield buf.getvalue()
    buf.seek(0); buf.truncate(0)

    if not resp.hits:
        return

    # 列头
    obs_cols = list(resp.hits[0].obs.keys()) if resp.hits else []
    w.writerow(["rank", "cell_id", "row_index", "distance", *obs_cols])
    yield buf.getvalue()
    buf.seek(0); buf.truncate(0)

    # 数据行
    for hit in resp.hits:
        w.writerow([hit.rank, hit.cell_id, hit.row_index, f"{hit.distance:.6f}",
                    *[hit.obs.get(c, "") for c in obs_cols]])
        yield buf.getvalue()
        buf.seek(0); buf.truncate(0)


# ---------- 过滤结果导出 ----------

def filter_csv_rows(user_id: int, db: Session) -> Iterator[str]:
    """流式生成细胞过滤结果 CSV，重跑全量不受分页限制。"""
    dataset_id, filters = filter_cache[user_id]
    ds = ds_service.get_ready(db, dataset_id)
    # 全量拉取，不分页
    items, total = ds_service.filter_cells(ds, filters, offset=0, limit=2 ** 31)

    buf = io.StringIO()
    w = csv.writer(buf)

    w.writerow([f"# Cell Filter Export — {_now_utc()}"])
    w.writerow([f"# dataset_id={dataset_id}  total_matched={total}"])
    yield buf.getvalue()
    buf.seek(0); buf.truncate(0)

    if not items:
        return

    obs_cols = list(items[0]["obs"].keys())
    w.writerow(["cell_id", "row_index", *obs_cols])
    yield buf.getvalue()
    buf.seek(0); buf.truncate(0)

    for item in items:
        w.writerow([item["cell_id"], item["row_index"],
                    *[item["obs"].get(c, "") for c in obs_cols]])
        yield buf.getvalue()
        buf.seek(0); buf.truncate(0)


# ---------- Benchmark 结果导出 ----------

_BM_COLS = [
    "batch_id", "batch_label", "dataset_id", "k", "n_queries", "seed",
    "algorithm", "params",
    "recall_at_k", "avg_latency_ms", "p50_latency_ms", "p95_latency_ms", "p99_latency_ms",
    "qps", "build_time_ms", "index_size_bytes", "created_at",
]


def benchmark_csv_rows_from(batches: list) -> Iterator[str]:
    """流式生成多批 benchmark 结果合并 CSV（batches 已由调用方加载）。"""
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(_BM_COLS)
    yield buf.getvalue()
    buf.seek(0); buf.truncate(0)

    for batch in batches:
        ts = batch.created_at.strftime("%Y-%m-%dT%H:%M:%S")
        for r in batch.results:
            w.writerow([
                batch.id, batch.label, batch.dataset_id, batch.k, batch.n_queries, batch.seed,
                r.algorithm, json.dumps(r.params, ensure_ascii=False),
                f"{r.recall_at_k:.4f}", f"{r.avg_latency_ms:.3f}",
                f"{r.p50_latency_ms:.3f}", f"{r.p95_latency_ms:.3f}", f"{r.p99_latency_ms:.3f}",
                f"{r.qps:.1f}", f"{r.build_time_ms:.1f}", r.index_size_bytes, ts,
            ])
            yield buf.getvalue()
            buf.seek(0); buf.truncate(0)
