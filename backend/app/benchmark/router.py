"""性能评测路由"""
from fastapi import APIRouter
router = APIRouter()
# POST /api/benchmark/run          运行算法对比
# GET  /api/benchmark/results      历史评测结果
# GET  /api/benchmark/results/{id} 某次详情
# TODO
