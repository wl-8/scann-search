"""Natural-language single-cell query and evidence-grounded analysis."""
from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from typing import Any

from sqlalchemy.orm import Session

from app.core import filters as obs_filters
from app.datasets import constants as ds_const
from app.datasets import service as ds_service
from app.rag import llm as llm_client
from app.rag.schemas import (
    RagDatasetEvidence,
    RagEvidenceCell,
    RagQueryRequest,
    RagQueryResponse,
)
from app.search.schemas import SearchFilter


_DISTRIBUTION_COLUMNS = (
    "cell_type",
    "celltype",
    "disease",
    "tissue",
    "organ",
    "sex",
    "condition",
    "batch",
    "sample",
    "phase",
)

_NATURAL_FILTER_COLUMNS = {
    "cell_type",
    "celltype",
    "author_cell_type",
    "disease",
    "tissue",
    "sex",
    "treatment",
    "condition",
    "phase",
    "age_condition",
    "development_stage",
    "assay",
    "sample_id",
    "donor_id",
}


def query(db: Session, req: RagQueryRequest) -> RagQueryResponse:
    datasets = _resolve_datasets(db, req.dataset_ids)
    interpreted = _interpret_filters(req.question, datasets, req.filters)
    evidence = [_collect_dataset_evidence(ds, interpreted, req.k) for ds in datasets]

    resolved = llm_client.resolve(req.llm)
    warnings: list[str] = []
    local_answer = _local_answer(req.question, interpreted, evidence)
    answer = local_answer
    llm_used = False

    if resolved.provider != "local":
        try:
            answer = llm_client.chat(
                resolved,
                system=_system_prompt(),
                user=_user_prompt(req.question, interpreted, evidence),
            )
            llm_used = True
        except Exception as exc:  # external providers should not break retrieval
            warnings.append(f"LLM 调用失败，已使用本地证据摘要：{exc}")

    return RagQueryResponse(
        question=req.question,
        answer=answer,
        provider=resolved.provider,
        model=resolved.model,
        llm_used=llm_used,
        interpreted_filters=interpreted,
        target_dataset_ids=[ds.id for ds in datasets],
        evidence=evidence,
        warnings=warnings,
    )


def _resolve_datasets(db: Session, dataset_ids: list[int]) -> list[Any]:
    if dataset_ids:
        return [ds_service.get_ready(db, dataset_id) for dataset_id in dataset_ids]
    return [
        ds for ds in ds_service.list_all(db)
        if ds.status == ds_const.STATUS_READY
    ][:5]


def _interpret_filters(question: str, datasets: list[Any], explicit: SearchFilter | None) -> SearchFilter:
    equals: dict[str, set[str]] = defaultdict(set)
    gte = dict(explicit.gte) if explicit else {}
    lte = dict(explicit.lte) if explicit else {}
    if explicit:
        for col, values in explicit.equals.items():
            equals[col].update(values)

    q = question.lower()
    q_tokens = set(re.findall(r"[\w.-]+", q))

    for ds in datasets:
        obs = ds_service.load_obs(ds)
        for col in obs.columns:
            if _normalized_col(col) not in _NATURAL_FILTER_COLUMNS:
                continue
            vc = obs[col].astype(str).value_counts()
            if len(vc) > 120:
                continue
            for raw_value in vc.index:
                value = str(raw_value)
                value_lower = value.lower()
                if len(value_lower) < 2:
                    continue
                if _value_mentioned(value_lower, q, q_tokens):
                    equals[col].add(value)

    return SearchFilter(
        equals={col: sorted(values) for col, values in equals.items() if values},
        gte=gte,
        lte=lte,
    )


def _normalized_col(col: str) -> str:
    return str(col).lower().replace(" ", "_")


def _value_mentioned(value: str, question: str, tokens: set[str]) -> bool:
    if re.fullmatch(r"[\w.-]+", value):
        return value in tokens
    return value in question


def _collect_dataset_evidence(ds: Any, filters: SearchFilter, k: int) -> RagDatasetEvidence:
    obs = ds_service.load_obs(ds)
    cell_ids = ds_service.load_cell_ids(ds)
    plan = obs_filters.build_filter_plan(obs, filters)
    sample_rows = plan.allowed_rows[:k]

    sampled: list[RagEvidenceCell] = []
    for row in sample_rows:
        row_int = int(row)
        cell_row = obs.iloc[row_int]
        sampled.append(RagEvidenceCell(
            dataset_id=ds.id,
            dataset_name=ds.name,
            cell_id=str(cell_ids[row_int]),
            row_index=row_int,
            obs={col: _jsonable(cell_row[col]) for col in obs.columns},
        ))

    return RagDatasetEvidence(
        dataset_id=ds.id,
        dataset_name=ds.name,
        n_cells=ds.n_cells,
        total_matches=plan.n_matching,
        matched_filters=filters,
        distributions=_distributions(obs.iloc[plan.allowed_rows], filters),
        sampled_cells=sampled,
    )


def _distributions(obs_subset, filters: SearchFilter) -> dict[str, dict[str, int]]:
    if obs_subset.empty:
        return {}
    columns = set(filters.equals.keys())
    for col in obs_subset.columns:
        normalized = col.lower().replace(" ", "_")
        if normalized in _DISTRIBUTION_COLUMNS:
            columns.add(col)
    out: dict[str, dict[str, int]] = {}
    for col in sorted(columns):
        if col not in obs_subset.columns:
            continue
        vc = obs_subset[col].astype(str).value_counts().head(8)
        out[col] = {str(k): int(v) for k, v in vc.items()}
    return out


def _local_answer(question: str, filters: SearchFilter, evidence: list[RagDatasetEvidence]) -> str:
    total = sum(item.total_matches for item in evidence)
    names = ", ".join(f"{item.dataset_name}(#{item.dataset_id})" for item in evidence)
    filter_text = _filter_text(filters)
    if total == 0:
        return f"没有找到匹配细胞。目标数据集：{names}；解析条件：{filter_text}。建议放宽细胞类型、疾病状态或组织来源等过滤条件。"

    top_lines = []
    for item in evidence:
        sample_ids = ", ".join(cell.cell_id for cell in item.sampled_cells[:3]) or "无样本"
        top_lines.append(f"{item.dataset_name}: {item.total_matches} 个匹配，样本 {sample_ids}")
    joined = "；".join(top_lines)
    return f"根据问题“{question}”，系统解析条件为 {filter_text}。在 {names} 中共找到 {total} 个匹配细胞。{joined}。可继续在检索或可视化页面按这些条件查看邻近细胞和 UMAP 分布。"


def _filter_text(filters: SearchFilter) -> str:
    parts: list[str] = []
    for col, values in filters.equals.items():
        parts.append(f"{col} in {values}")
    for col, value in filters.gte.items():
        parts.append(f"{col} >= {value}")
    for col, value in filters.lte.items():
        parts.append(f"{col} <= {value}")
    return "; ".join(parts) if parts else "未识别到明确过滤条件"


def _system_prompt() -> str:
    return (
        "你是单细胞数据分析助手。只能依据用户问题和检索证据回答；"
        "不要编造基因表达、疾病结论或统计显著性。用中文回答，先给结论，"
        "再列证据和下一步分析建议。"
    )


def _user_prompt(question: str, filters: SearchFilter, evidence: list[RagDatasetEvidence]) -> str:
    evidence_payload = [
        {
            "dataset_id": item.dataset_id,
            "dataset_name": item.dataset_name,
            "n_cells": item.n_cells,
            "total_matches": item.total_matches,
            "distributions": item.distributions,
            "sampled_cells": [
                {
                    "cell_id": cell.cell_id,
                    "row_index": cell.row_index,
                    "obs": cell.obs,
                }
                for cell in item.sampled_cells[:8]
            ],
        }
        for item in evidence
    ]
    return json.dumps(
        {
            "question": question,
            "interpreted_filters": filters.model_dump(),
            "evidence": evidence_payload,
        },
        ensure_ascii=False,
        default=str,
    )


def _jsonable(v: Any) -> Any:
    if hasattr(v, "item"):
        v = v.item()
    if isinstance(v, float) and math.isnan(v):
        return None
    if v is None:
        return None
    if isinstance(v, (str, int, float, bool)):
        return v
    return str(v)
