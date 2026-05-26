"""导出模块的内存缓存。

每次检索/过滤后，对应用户的结果写入此处；导出端点直接读取，无需重跑。
缓存键为 user_id（int），每个用户只保留最近一次结果。
"""
from __future__ import annotations

from app.datasets.schemas import FilterSpec
from app.search.schemas import SearchResponse

# user_id → 最近一次 ANN 检索结果
search_cache: dict[int, SearchResponse] = {}

# user_id → (dataset_id, FilterSpec) 用于导出时重新跑全量过滤
filter_cache: dict[int, tuple[int, FilterSpec]] = {}
