"""Shared obs filtering helpers.

The backend uses the same filter shape in dataset browsing, ANN search, and
filtered-strategy comparison. Keeping the semantics here avoids subtle drift
between those paths.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import numpy as np
import pandas as pd


class ObsFilter(Protocol):
    equals: dict[str, list[str]]
    gte: dict[str, float]
    lte: dict[str, float]


@dataclass(frozen=True)
class FilterPlan:
    """Precomputed row set for an obs filter."""

    allowed_rows: np.ndarray
    n_total: int

    @property
    def n_matching(self) -> int:
        return int(self.allowed_rows.size)

    @property
    def selectivity(self) -> float:
        return self.n_matching / self.n_total if self.n_total > 0 else 0.0

    def page(self, offset: int, limit: int) -> np.ndarray:
        return self.allowed_rows[offset: offset + limit]


def has_filters(filters: ObsFilter | None) -> bool:
    return filters is not None and bool(filters.equals or filters.gte or filters.lte)


def build_filter_plan(obs: pd.DataFrame, filters: ObsFilter | None) -> FilterPlan:
    return FilterPlan(
        allowed_rows=compute_allowed_rows(obs, filters),
        n_total=len(obs),
    )


def compute_allowed_rows(obs: pd.DataFrame, filters: ObsFilter | None) -> np.ndarray:
    """Return row positions satisfying filters, in ascending row order."""
    n = len(obs)
    if not has_filters(filters):
        return np.arange(n, dtype=np.int64)

    mask = np.ones(n, dtype=bool)
    assert filters is not None

    for col, allowed in filters.equals.items():
        if col not in obs.columns:
            return np.array([], dtype=np.int64)
        col_str = obs[col].astype(str).to_numpy()
        mask &= np.isin(col_str, allowed)

    for col, threshold in filters.gte.items():
        if col not in obs.columns:
            return np.array([], dtype=np.int64)
        col_num = pd.to_numeric(obs[col], errors="coerce").to_numpy()
        mask &= (col_num >= threshold) & ~np.isnan(col_num)

    for col, threshold in filters.lte.items():
        if col not in obs.columns:
            return np.array([], dtype=np.int64)
        col_num = pd.to_numeric(obs[col], errors="coerce").to_numpy()
        mask &= (col_num <= threshold) & ~np.isnan(col_num)

    return np.where(mask)[0].astype(np.int64)


def matches_row(row: pd.Series, filters: ObsFilter | None) -> bool:
    if not has_filters(filters):
        return True

    assert filters is not None
    for col, allowed in filters.equals.items():
        if col not in row.index or str(row[col]) not in allowed:
            return False
    for col, threshold in filters.gte.items():
        if col not in row.index:
            return False
        try:
            if float(row[col]) < threshold:
                return False
        except (TypeError, ValueError):
            return False
    for col, threshold in filters.lte.items():
        if col not in row.index:
            return False
        try:
            if float(row[col]) > threshold:
                return False
        except (TypeError, ValueError):
            return False
    return True
