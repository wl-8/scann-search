"""RAG API schemas."""
from __future__ import annotations

from typing import Annotated, Any

from pydantic import BaseModel, Field

from app.search.constants import DEFAULT_K, MAX_K
from app.search.schemas import SearchFilter


class LLMOptions(BaseModel):
    provider: str = Field(
        default="local",
        description="local / openai / deepseek / dashscope / moonshot / zhipuai / siliconflow / custom",
    )
    model: str = ""
    base_url: str = ""
    api_key: str = Field(default="", repr=False)
    temperature: float = Field(default=0.2, ge=0, le=2)


class RagQueryRequest(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    dataset_ids: Annotated[list[int], Field(max_length=20)] = Field(default_factory=list)
    filters: SearchFilter | None = None
    k: int = Field(default=DEFAULT_K, ge=1, le=MAX_K)
    llm: LLMOptions = Field(default_factory=LLMOptions)


class RagEvidenceCell(BaseModel):
    dataset_id: int
    dataset_name: str
    cell_id: str
    row_index: int
    obs: dict[str, Any]


class RagDatasetEvidence(BaseModel):
    dataset_id: int
    dataset_name: str
    n_cells: int
    total_matches: int
    matched_filters: SearchFilter
    distributions: dict[str, dict[str, int]]
    sampled_cells: list[RagEvidenceCell]


class RagQueryResponse(BaseModel):
    question: str
    answer: str
    provider: str
    model: str
    llm_used: bool
    interpreted_filters: SearchFilter
    target_dataset_ids: list[int]
    evidence: list[RagDatasetEvidence]
    warnings: list[str] = Field(default_factory=list)
