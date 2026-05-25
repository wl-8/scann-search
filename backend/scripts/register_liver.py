"""真实数据冒烟测试：注册 ../data/liver.h5ad → 建 HNSW → 取 top-10 相似细胞。

直接调 service 层，不走 HTTP；目的是最快验证整条链路 + 给团队当 demo 复现脚本。

用法（在 backend/ 目录下）：

    conda activate scann-search
    python scripts/register_liver.py
"""
from __future__ import annotations

import logging
import sys
import time
from pathlib import Path

# 让脚本可以直接 `python scripts/register_liver.py` 跑（自动把 backend/ 加进 sys.path）
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

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
from app.search.schemas import SearchByCellRequest, SearchFilter  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("smoke")

LIVER_PATH = (ROOT.parent / "data" / "liver.h5ad").resolve()
DATASET_NAME = "liver"


def _get_or_register(db) -> Dataset:
    existing = db.scalar(select(Dataset).where(Dataset.name == DATASET_NAME))
    if existing is not None and existing.status == "ready":
        logger.info("dataset '%s' 已注册（id=%s），跳过抽取", DATASET_NAME, existing.id)
        return existing
    logger.info("注册数据集 '%s'，源文件 %s", DATASET_NAME, LIVER_PATH)
    t0 = time.perf_counter()
    ds = ds_service.register(
        db,
        DatasetRegisterRequest(name=DATASET_NAME, source_path=str(LIVER_PATH)),
    )
    logger.info(
        "注册完成（耗时 %.1fs）: id=%s n_cells=%d vector_dim=%d",
        time.perf_counter() - t0, ds.id, ds.n_cells, ds.vector_dim,
    )
    return ds


def _get_or_build_hnsw(db, ds: Dataset):
    existing_indexes = idx_service.list_all(db, dataset_id=ds.id)
    for x in existing_indexes:
        if x.algorithm == idx_const.ALGO_HNSW and x.status == idx_const.STATUS_READY:
            logger.info("HNSW 索引已存在（id=%s），跳过构建", x.id)
            return x
    logger.info("构建 HNSW 索引（M=16, ef_construction=200, ef_search=50）...")
    t0 = time.perf_counter()
    obj = idx_service.build(
        db,
        IndexBuildRequest(
            dataset_id=ds.id,
            algorithm=idx_const.ALGO_HNSW,
            params={"M": 16, "ef_construction": 200, "ef_search": 50},
        ),
    )
    logger.info(
        "构建完成（耗时 %.1fs）: id=%s build_time=%.0fms size=%.1f MB",
        time.perf_counter() - t0, obj.id, obj.build_time_ms, obj.index_size_bytes / 1024 / 1024,
    )
    return obj


def _demo_search(db, ds: Dataset, index_obj) -> None:
    cell_ids = ds_service.load_cell_ids(ds)
    obs = ds_service.load_obs(ds)

    # 选第一个细胞作示例
    cell_id = str(cell_ids[0])
    logger.info("查询细胞: %s", cell_id)
    if "cell_type" in obs.columns:
        logger.info("该细胞的 cell_type = %s", obs.iloc[0]["cell_type"])

    # ---- 不带过滤 ----
    resp = search_service.search_by_cell(
        db,
        SearchByCellRequest(index_id=index_obj.id, cell_id=cell_id, k=10),
    )
    logger.info("[无过滤] 返回 %d 条，耗时 %.2f ms", resp.n_returned, resp.latency_ms)
    for h in resp.hits[:5]:
        ct = h.obs.get("cell_type", "?")
        logger.info("  rank=%d cell_id=%s cell_type=%s dist=%.4f", h.rank, h.cell_id, ct, h.distance)

    # ---- 带 cell_type 过滤（如果 obs 有这一列）----
    if "cell_type" in obs.columns:
        target_type = str(obs.iloc[0]["cell_type"])
        resp2 = search_service.search_by_cell(
            db,
            SearchByCellRequest(
                index_id=index_obj.id,
                cell_id=cell_id,
                k=10,
                filters=SearchFilter(equals={"cell_type": [target_type]}),
                oversample=30,
            ),
        )
        logger.info(
            "[条件过滤 cell_type=%s] 返回 %d 条，耗时 %.2f ms",
            target_type, resp2.n_returned, resp2.latency_ms,
        )
        for h in resp2.hits[:5]:
            ct = h.obs.get("cell_type", "?")
            logger.info("  rank=%d cell_id=%s cell_type=%s dist=%.4f", h.rank, h.cell_id, ct, h.distance)


def main() -> int:
    if not LIVER_PATH.exists():
        logger.error("未找到 %s", LIVER_PATH)
        return 1

    init_db()
    db = SessionLocal()
    try:
        ds = _get_or_register(db)
        index_obj = _get_or_build_hnsw(db, ds)
        _demo_search(db, ds, index_obj)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
