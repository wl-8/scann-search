"""用户管理路由（管理员）"""
from fastapi import APIRouter
router = APIRouter()
# GET    /api/users              用户列表
# GET    /api/users/me           当前用户
# GET    /api/users/pending      待审核用户列表
# PUT    /api/users/me           修改个人信息
# PUT    /api/users/{id}         修改角色（管理员）
# POST   /api/users/{id}/approve 审核通过（管理员）
# POST   /api/users/{id}/reject  审核拒绝（管理员）
# POST   /api/users/{id}/ban     封禁（管理员）
# POST   /api/users/{id}/unban   解封（管理员）
# DELETE /api/users/{id}         删除用户（管理员）
# TODO
