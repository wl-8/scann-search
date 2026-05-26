from fastapi import HTTPException, status


class UserNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")


class CannotModifyAdminError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="无法修改管理员账号")


class InvalidRoleError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的角色")
