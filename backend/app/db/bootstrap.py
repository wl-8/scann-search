"""Development bootstrap for the bundled single-cell dataset.

When ``data/liver.h5ad`` is present, this module registers it and builds a
default ANN index. The workflow is idempotent so repeated app starts reuse the
ready dataset/index instead of rebuilding.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.datasets import constants as ds_const
from app.datasets import service as dataset_service
from app.datasets.models import Dataset
from app.datasets.schemas import DatasetRegisterRequest
from app.db.session import SessionLocal
from app.index import constants as index_const
from app.index import service as index_service
from app.index.models import Index
from app.index.schemas import IndexBuildRequest

logger = logging.getLogger(__name__)

_DEFAULT_HNSW_PARAMS = {
    "M": 16,
    "ef_construction": 200,
    "ef_search": 50,
}


def bootstrap_default_dataset() -> None:
    """Ensure the configured local dataset and default index exist."""
    if not settings.AUTO_BOOTSTRAP_DATA:
        logger.info("default dataset bootstrap disabled")
        return

    dataset_path = _resolve_dataset_path(settings.BOOTSTRAP_DATASET_PATH)
    if not dataset_path.exists():
        logger.info("default dataset not found at %s, skip bootstrap", dataset_path)
        return

    db = SessionLocal()
    try:
        dataset = _get_or_register_dataset(db, dataset_path)
        if dataset is None:
            return
        _get_or_build_index(db, dataset)
    finally:
        db.close()


def _get_or_register_dataset(db, dataset_path: Path) -> Dataset | None:
    dataset = db.scalar(
        select(Dataset).where(Dataset.name == settings.BOOTSTRAP_DATASET_NAME)
    )
    if dataset is not None:
        if dataset.status == ds_const.STATUS_READY:
            logger.info("default dataset '%s' already ready, skip register", dataset.name)
            return dataset
        logger.warning(
            "default dataset '%s' exists but status is %s; skip auto-register to avoid overwriting user state",
            dataset.name,
            dataset.status,
        )
        return None

    logger.info("register default dataset '%s' from %s", settings.BOOTSTRAP_DATASET_NAME, dataset_path)
    started = time.perf_counter()
    dataset = dataset_service.register(
        db,
        DatasetRegisterRequest(
            name=settings.BOOTSTRAP_DATASET_NAME,
            source_path=str(dataset_path),
            description="Bundled liver single-cell dataset",
            embedding_key=settings.BOOTSTRAP_EMBEDDING_KEY,
        ),
    )
    logger.info(
        "default dataset ready: id=%s cells=%s dim=%s elapsed=%.1fs",
        dataset.id,
        dataset.n_cells,
        dataset.vector_dim,
        time.perf_counter() - started,
    )
    return dataset


def _get_or_build_index(db, dataset: Dataset) -> Index:
    existing = db.scalar(
        select(Index)
        .where(Index.dataset_id == dataset.id)
        .where(Index.algorithm == settings.BOOTSTRAP_INDEX_ALGORITHM)
        .where(Index.status == index_const.STATUS_READY)
        .order_by(Index.id.desc())
    )
    if existing is not None:
        logger.info("default %s index already ready, skip build", existing.algorithm)
        return existing

    logger.info(
        "build default %s index for dataset %s",
        settings.BOOTSTRAP_INDEX_ALGORITHM,
        dataset.id,
    )
    started = time.perf_counter()
    index = index_service.build(
        db,
        IndexBuildRequest(
            dataset_id=dataset.id,
            algorithm=settings.BOOTSTRAP_INDEX_ALGORITHM,
            params=_index_params(settings.BOOTSTRAP_INDEX_ALGORITHM),
        ),
    )
    logger.info(
        "default index ready: id=%s vectors=%s dim=%s elapsed=%.1fs",
        index.id,
        index.n_vectors,
        index.vector_dim,
        time.perf_counter() - started,
    )
    return index


def _index_params(algorithm: str) -> dict[str, int]:
    if algorithm == index_const.ALGO_HNSW:
        return dict(_DEFAULT_HNSW_PARAMS)
    return {}


def _resolve_dataset_path(raw_path: str) -> Path:
    raw = Path(raw_path).expanduser()
    if raw.is_absolute():
        return raw.resolve()

    backend_root = Path(__file__).resolve().parents[2]
    project_root = Path(__file__).resolve().parents[3]
    candidates = [
        Path.cwd() / raw,
        backend_root / raw,
        project_root / raw,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    return (project_root / raw).resolve()
