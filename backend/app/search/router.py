"""检索路由"""
from fastapi import APIRouter
router = APIRouter()
# POST /api/search               Top-K检索（cell_id或向量）
# POST /api/search/conditional   条件检索（cell_type/disease/age_group过滤）
# POST /api/search/multi-dataset 多数据集联合检索
# POST /api/search/browse        数据浏览/筛选
# GET  /api/search/history       查询历史
# TODO
