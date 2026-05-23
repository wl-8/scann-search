"""索引管理路由"""
from fastapi import APIRouter
router = APIRouter()
# POST   /api/index/build       构建索引（指定算法）
# GET    /api/index/status/{id} 查询构建状态
# DELETE /api/index/{id}        删除索引
# GET    /api/index/list        所有索引列表
# TODO
