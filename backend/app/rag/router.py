"""RAG routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.dependencies import get_current_user, get_db
from app.rag import service
from app.rag.schemas import RagQueryRequest, RagQueryResponse

router = APIRouter()


@router.post("/query", response_model=RagQueryResponse)
def rag_query(
    req: RagQueryRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> RagQueryResponse:
    return service.query(db, req)
