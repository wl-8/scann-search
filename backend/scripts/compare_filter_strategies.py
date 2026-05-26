"""跑真实 liver 数据上的三种过滤策略对比。

产出：
- 控制台 ASCII 表格（可截图进报告）
- ``data/compare_filter_strategies.csv``（可导入 Excel / Pandas 二次分析）

复用现有 dataset/index（如果还没有就自动 register + build）。

用法（在 backend/ 目录下执行）：

    conda activate scann-search
    python scripts/compare_filter_strategies.py

可选参数：
    --k 10
    --queries-per-scenario 5
    --seed 42
"""
from __future__ import annotations

import argparse
import csv
import logging
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.datasets import service as ds_service  # noqa: E402
from app.datasets.models import Dataset  # noqa: E402
from app.datasets.schemas import DatasetRegisterRequest  # noqa: E402
from app.db.init_db import init_db  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.index import constants as idx_const  # noqa: E402
from app.index import service as idx_service  # noqa: E402
from app.index.schemas import IndexBuildRequest  # noqa: E402
from app.search import service as search_service  # noqa: E402
from app.search.schemas import CompareStrategiesRequest, SearchFilter  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("compare")

LIVER_PATH = (ROOT.parent / "data" / "liver.h5ad").resolve()
DATASET_NAME = "liver"
CSV_OUT = ROOT.parent / "data" / "compare_filter_strategies.csv"


# ─── dataset / index 复用 ──────────────────────────────────────────────────────

def _get_or_register(db) -> Dataset:
    existing = db.scalar(select(Dataset).where(Dataset.name == DATASET_NAME))
    if existing is not None and existing.status == "ready":
        logger.info("dataset '%s' 已注册（id=%s）", DATASET_NAME, existing.id)
        return existing
    if not LIVER_PATH.exists():
        raise FileNotFoundError(f"未找到 {LIVER_PATH}")
    logger.info("注册 %s ...", LIVER_PATH)
    t0 = time.perf_counter()
    ds = ds_service.register(db, DatasetRegisterRequest(name=DATASET_NAME, source_path=str(LIVER_PATH)))
    logger.info("注册完成 %.1fs: n_cells=%d", time.perf_counter() - t0, ds.n_cells)
    return ds


def _get_or_build_hnsw(db, ds: Dataset):
    for x in idx_service.list_all(db, dataset_id=ds.id):
        if x.algorithm == idx_const.ALGO_HNSW and x.status == idx_const.STATUS_READY:
            logger.info("HNSW 索引已存在（id=%s, build=%dms）", x.id, x.build_time_ms)
            return x
    logger.info("构建 HNSW (M=16, ef_construction=200, ef_search=50) ...")
    return idx_service.build(
        db,
        IndexBuildRequest(
            dataset_id=ds.id,
            algorithm=idx_const.ALGO_HNSW,
            params={"M": 16, "ef_construction": 200, "ef_search": 50},
        ),
    )


# ─── 场景选择 ──────────────────────────────────────────────────────────────────

def _pick_scenarios(ds: Dataset) -> list[tuple[str, SearchFilter]]:
    """按 cell_type 频次自动挑 3 个有代表性的场景（高/中/低选择度）。"""
    obs = ds_service.load_obs(ds)
    if "cell_type" not in obs.columns:
        logger.warning("obs 没有 cell_type 列，回退到 disease 过滤")
        col = "disease" if "disease" in obs.columns else obs.columns[0]
    else:
        col = "cell_type"

    counts = obs[col].astype(str).value_counts().to_dict()
    # 至少有 k+1 个才有意义，否则 pre/post 都拿不齐
    candidates = sorted(
        [(name, n) for name, n in counts.items() if n >= 12],
        key=lambda kv: kv[1],
    )
    if len(candidates) < 3:
        return [(f"{col}={name}", SearchFilter(equals={col: [name]})) for name, _ in candidates]

    low = candidates[0]              # 最稀少（去掉 < 12 的）
    mid = candidates[len(candidates) // 2]
    high = candidates[-1]            # 最常见

    return [
        (f"高选择度 {col}={high[0]} ({high[1]} cells)",  SearchFilter(equals={col: [high[0]]})),
        (f"中选择度 {col}={mid[0]} ({mid[1]} cells)",   SearchFilter(equals={col: [mid[0]]})),
        (f"低选择度 {col}={low[0]} ({low[1]} cells)",   SearchFilter(equals={col: [low[0]]})),
    ]


# ─── 跑一个场景 ───────────────────────────────────────────────────────────────

def _run_scenario(
    db,
    index_obj,
    label: str,
    filt: SearchFilter,
    cell_ids: np.ndarray,
    k: int,
    n_queries: int,
    rng: np.random.Generator,
) -> dict:
    """对同一 scenario 用 n_queries 个不同的查询细胞跑对比，返回平均指标。"""
    # 抽 n_queries 个查询细胞（从满足 filter 的细胞里抽 —— 这样更像"用户从结果里再点一个查"）
    obs = ds_service.load_obs(db.get(Dataset, index_obj.dataset_id))
    # 用 strategies 模块的工具函数选符合条件的行
    from app.search import strategies as strat
    allowed = strat.compute_allowed_rows(obs, filt)
    if allowed.size == 0:
        return {"label": label, "skipped": "no matching cells"}
    query_rows = rng.choice(allowed, size=min(n_queries, allowed.size), replace=False)

    per_strategy: dict[str, list[dict]] = {"post": [], "pre": [], "hybrid": []}
    selectivity = None
    n_matching = None

    for qrow in query_rows:
        req = CompareStrategiesRequest(
            index_id=index_obj.id,
            cell_id=str(cell_ids[int(qrow)]),
            k=k,
            filters=filt,
            oversample=10,
        )
        resp = search_service.compare_strategies(db, req)
        if selectivity is None:
            selectivity = resp.filter_selectivity
            n_matching = resp.n_matching_filter
        for r in resp.results:
            per_strategy[r.strategy].append({
                "latency_ms": r.latency_ms,
                "recall": r.recall_at_k,
                "n_returned": r.n_returned,
            })

    def _avg(xs, key):
        return statistics.mean(x[key] for x in xs) if xs else 0.0

    return {
        "label": label,
        "selectivity": selectivity,
        "n_matching": n_matching,
        "k": k,
        "n_queries": int(query_rows.size),
        "strategies": {
            name: {
                "n_returned": _avg(rows, "n_returned"),
                "recall": _avg(rows, "recall"),
                "latency_ms": _avg(rows, "latency_ms"),
            }
            for name, rows in per_strategy.items()
        },
    }


# ─── 打印 + 写 CSV ────────────────────────────────────────────────────────────

def _print_table(results: list[dict], k: int) -> None:
    print()
    print(f"{'='*78}")
    print(f"  过滤策略对比 —— recall@{k} × latency × n_returned（avg over n_queries）")
    print(f"{'='*78}")
    for r in results:
        if "skipped" in r:
            print(f"\n  {r['label']}  [SKIPPED: {r['skipped']}]")
            continue
        print(f"\n  {r['label']}")
        print(f"  selectivity = {r['selectivity']*100:.2f}%   n_matching = {r['n_matching']}   "
              f"n_queries = {r['n_queries']}")
        print(f"    {'strategy':<10} {'n_returned':>10} {'recall@k':>10} {'latency_ms':>12}")
        for name in ("post", "pre", "hybrid"):
            s = r["strategies"][name]
            print(f"    {name:<10} {s['n_returned']:>10.2f} {s['recall']:>10.4f} {s['latency_ms']:>12.3f}")
    print(f"\n{'='*78}\n")


def _write_csv(results: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["scenario", "selectivity", "n_matching", "n_queries", "k",
                    "strategy", "n_returned_avg", "recall_at_k_avg", "latency_ms_avg"])
        for r in results:
            if "skipped" in r:
                continue
            for name, s in r["strategies"].items():
                w.writerow([
                    r["label"], r["selectivity"], r["n_matching"], r["n_queries"], r["k"],
                    name, s["n_returned"], s["recall"], s["latency_ms"],
                ])
    logger.info("CSV 写入 %s", path)


# ─── main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=10)
    parser.add_argument("--queries-per-scenario", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        ds = _get_or_register(db)
        index_obj = _get_or_build_hnsw(db, ds)
        cell_ids = ds_service.load_cell_ids(ds)

        scenarios = _pick_scenarios(ds)
        if not scenarios:
            logger.error("找不到任何合适的 scenario，退出")
            return 1
        logger.info("跑 %d 个场景，每个 %d 个查询", len(scenarios), args.queries_per_scenario)

        rng = np.random.default_rng(args.seed)
        results = [
            _run_scenario(db, index_obj, label, filt, cell_ids,
                          k=args.k, n_queries=args.queries_per_scenario, rng=rng)
            for label, filt in scenarios
        ]

        _print_table(results, args.k)
        _write_csv(results, CSV_OUT)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
