"""认证路由"""
from fastapi import APIRouter
router = APIRouter()
# POST /api/auth/register  注册（提交后进入待审核状态）
# POST /api/auth/login     登录返回JWT
# POST /api/auth/logout    登出
# TODO
