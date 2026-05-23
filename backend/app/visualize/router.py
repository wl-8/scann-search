"""可视化路由"""
from fastapi import APIRouter
router = APIRouter()
# GET  /api/visualize/umap/{id}    UMAP 2D坐标+元数据
# GET  /api/visualize/umap3d/{id}  UMAP 3D坐标
# GET  /api/visualize/pca/{id}     PCA坐标
# POST /api/visualize/highlight    传cell_id列表返回高亮坐标
# TODO
