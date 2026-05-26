from fastapi import HTTPException, status


class CredentialsError(HTTPException):
    def __init__(self, detail: str = "用户名或密码错误"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class AccountLockedError(HTTPException):
    def __init__(self, detail: str = "账号已锁定，请稍后重试"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class AccountBannedError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="账号已封禁")


class ReviewPendingError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="账号待审核，请等待管理员审核")


class ReviewRejectedError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="注册申请未通过")


class UsernameExistsError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")


class EmailExistsError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail="邮箱已被注册")
