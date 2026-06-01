"""数据集管理路由。

POST   /api/datasets/upload-file       上传 .h5ad 文件到服务器，返回保存路径（不注册）
POST   /api/datasets/register          注册已存在的 .h5ad
GET    /api/datasets                   列表
GET    /api/datasets/{id}              详情
PUT    /api/datasets/{id}/embedding    切换检索向量（obsm key），级联删除旧索引
DELETE /api/datasets/{id}             删除（同步删工件 + 关联索引）
GET    /api/datasets/{id}/stats        obs 字段取值分布
GET    /api/datasets/{id}/cells        分页细胞列表
POST   /api/datasets/{id}/cells/filter 按 obs 条件过滤细胞
"""
import time
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.config import settings
from app.core.dependencies import get_current_user, get_db, require_researcher
from app.datasets import service
from app.datasets.schemas import (
    CellFilterRequest,
    CellFilterResponse,
    CellPageResponse,
    CellResponse,
    DatasetRegisterRequest,
    DatasetResponse,
    DatasetStatsResponse,
    EmbeddingChangeRequest,
)

router = APIRouter()

_MAX_UPLOAD_BYTES = 4 * 1024 * 1024 * 1024  # 4 GB


@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(..., description=".h5ad 文件"),
    _: User = Depends(require_researcher),
) -> dict:
    """将 .h5ad 文件保存到服务器 uploads 目录，返回绝对路径供后续注册使用。"""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".h5ad", ".h5"}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="仅支持 .h5ad 文件")

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stem = Path(file.filename or f"upload_{int(time.time())}").stem
    save_path = upload_dir / f"{stem}_{int(time.time())}{suffix}"

    size = 0
    with save_path.open("wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1 MB chunks
            size += len(chunk)
            if size > _MAX_UPLOAD_BYTES:
                f.close()
                save_path.unlink(missing_ok=True)
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="文件超过 4 GB 上限")
            f.write(chunk)

    # 读取 obsm 可用 keys，失败时静默降级
    embedding_keys: list[str] = []
    try:
        import anndata as ad
        adata = ad.read_h5ad(save_path, backed="r")
        embedding_keys = list(adata.obsm.keys())
        if adata.isbacked:
            adata.file.close()
    except Exception:
        pass

    return {
        "path": str(save_path.resolve()),
        "filename": file.filename,
        "size_bytes": size,
        "embedding_keys": embedding_keys,
    }


@router.post("/register", response_model=DatasetResponse)
def register_dataset(req: DatasetRegisterRequest, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> DatasetResponse:
    ds = service.register(db, req)
    return DatasetResponse.model_validate(ds)


@router.get("", response_model=list[DatasetResponse])
def list_datasets(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[DatasetResponse]:
    return [DatasetResponse.model_validate(d) for d in service.list_all(db)]


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> DatasetResponse:
    return DatasetResponse.model_validate(service.get_by_id(db, dataset_id))


@router.put("/{dataset_id}/embedding", response_model=DatasetResponse)
def switch_embedding(
    dataset_id: int,
    req: EmbeddingChangeRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_researcher),
) -> DatasetResponse:
    ds = service.switch_embedding(db, dataset_id, req.embedding_key)
    return DatasetResponse.model_validate(ds)


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db), _: User = Depends(require_researcher)) -> None:
    service.delete(db, dataset_id)


@router.get("/{dataset_id}/stats", response_model=DatasetStatsResponse)
def dataset_stats(dataset_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> DatasetStatsResponse:
    ds = service.get_ready(db, dataset_id)
    counts = service.value_counts(ds)
    return DatasetStatsResponse(
        dataset_id=ds.id,
        obs_columns=list(counts.keys()),
        value_counts=counts,
        numeric_summary=service.numeric_summary(ds),
    )


@router.get("/{dataset_id}/cells", response_model=CellPageResponse)
def list_cells(
    dataset_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CellPageResponse:
    ds = service.get_ready(db, dataset_id)
    obs = service.load_obs(ds)
    cell_ids = service.load_cell_ids(ds)
    total = int(len(obs))

    end = min(offset + limit, total)
    items: list[CellResponse] = []
    for i in range(offset, end):
        row: dict[str, Any] = {
            col: _to_jsonable(obs.iloc[i][col]) for col in obs.columns
        }
        items.append(CellResponse(cell_id=str(cell_ids[i]), row_index=i, obs=row))

    return CellPageResponse(
        dataset_id=ds.id, total=total, offset=offset, limit=limit, items=items,
    )


@router.post("/{dataset_id}/cells/filter", response_model=CellFilterResponse)
def filter_cells(
    dataset_id: int,
    req: CellFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CellFilterResponse:
    ds = service.get_ready(db, dataset_id)
    items, total = service.filter_cells(ds, req.filters, req.offset, req.limit, cache_for=current_user.id)
    return CellFilterResponse(
        dataset_id=ds.id,
        total_matched=total,
        offset=req.offset,
        limit=req.limit,
        items=[CellResponse(**item) for item in items],
    )


def _to_jsonable(v: Any) -> Any:
    # pandas/numpy → 纯 Python，便于 JSON 序列化
    import math

    import numpy as np
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return None if math.isnan(f) else f
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if v is None:
        return None
    return v if isinstance(v, (str, int, float, bool)) else str(v)
