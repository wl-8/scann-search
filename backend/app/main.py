"""FastAPI 应用入口，注册所有路由。"""
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.benchmark.router import router as benchmark_router
from app.datasets.router import router as datasets_router
from app.export.router import router as export_router
from app.index.router import router as index_router
from app.rag.router import router as rag_router
from app.search.router import router as search_router
from app.users.router import router as users_router
from app.visualize.router import router as visualize_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Import at startup so tests that reload db.session/init_db get the current
    # engine and SessionLocal instead of module-level stale bindings.
    from app.db.init_db import init_db
    from app.db.bootstrap import bootstrap_default_dataset

    init_db()
    bootstrap_default_dataset()
    yield


app = FastAPI(title="单细胞ANN检索系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,      prefix="/api/auth",      tags=["认证"])
app.include_router(users_router,     prefix="/api/users",     tags=["用户管理"])
app.include_router(datasets_router,  prefix="/api/datasets",  tags=["数据集管理"])
app.include_router(index_router,     prefix="/api/index",     tags=["索引管理"])
app.include_router(search_router,    prefix="/api/search",    tags=["检索"])
app.include_router(rag_router,       prefix="/api/rag",       tags=["RAG"])
app.include_router(visualize_router, prefix="/api/visualize", tags=["可视化"])
app.include_router(benchmark_router, prefix="/api/benchmark", tags=["性能评测"])
app.include_router(export_router,    prefix="/api/export",    tags=["导出"])


@app.get("/api/health", tags=["健康"])
def health() -> dict[str, str]:
    return {"status": "ok"}
