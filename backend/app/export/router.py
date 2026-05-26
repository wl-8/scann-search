"""导出路由。

GET /api/export/search                    导出最近一次 ANN 检索结果 CSV（researcher+）
GET /api/export/filter                    导出最近一次细胞过滤结果 CSV（researcher+）
GET /api/export/benchmark?batch_ids=1,2   导出一批或多批 benchmark 结果 CSV（researcher+）
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth.models import User
from app.benchmark import service as bm_service
from app.benchmark.exceptions import BenchmarkBatchNotFound
from app.core.dependencies import get_db, require_researcher
from app.export import cache as export_cache
from app.export import service

router = APIRouter()


@router.get("/search")
def export_search(
    current_user: User = Depends(require_researcher),
) -> StreamingResponse:
    if current_user.id not in export_cache.search_cache:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="没有可导出的检索结果，请先执行一次检索")
    filename = f"search_{current_user.id}.csv"
    return StreamingResponse(
        service.search_csv_rows(current_user.id),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/filter")
def export_filter(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_researcher),
) -> StreamingResponse:
    if current_user.id not in export_cache.filter_cache:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="没有可导出的过滤结果，请先执行一次条件过滤")
    filename = f"filter_{current_user.id}.csv"
    return StreamingResponse(
        service.filter_csv_rows(current_user.id, db),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/benchmark")
def export_benchmark(
    batch_ids: list[int] = Query(description="一个或多个 batch id，如 ?batch_ids=1&batch_ids=2"),
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> StreamingResponse:
    # 预检：至少一个 batch 存在，否则提前 404（StreamingResponse 开始后不能再抛异常）
    batches = bm_service.get_batches_for_export(db, batch_ids)
    if not batches:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="指定的 benchmark 批次不存在")
    ids_str = "_".join(str(i) for i in batch_ids[:5])
    filename = f"benchmark_{ids_str}.csv"
    return StreamingResponse(
        service.benchmark_csv_rows_from(batches),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
