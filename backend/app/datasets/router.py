"""数据集管理路由"""
from fastapi import APIRouter
router = APIRouter()
# GET    /api/datasets           列表
# POST   /api/datasets           上传.h5ad
# GET    /api/datasets/{id}      详情
# DELETE /api/datasets/{id}      删除（同步删索引）
# GET    /api/datasets/{id}/cells 分页细胞列表
# TODO
