"""FastAPI 全局依赖。"""
from collections.abc import Generator
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth.constants import (
    ACCOUNT_BANNED,
    ACCOUNT_LOCKED,
    REVIEW_APPROVED,
    ROLE_ADMIN,
    ROLE_RESEARCHER,
)
from app.core.security import decode_access_token
from app.db.session import SessionLocal

_bearer = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
):
    from app.auth.models import User

    try:
        payload = decode_access_token(credentials.credentials)
        username: str | None = payload.get("sub")
        if not username:
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证凭据")

    user: User | None = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
    if user.account_status == ACCOUNT_BANNED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已封禁")
    if user.account_status == ACCOUNT_LOCKED:
        if user.locked_until and datetime.now(timezone.utc).replace(tzinfo=None) < user.locked_until:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已锁定")
    if user.review_status != REVIEW_APPROVED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号未审核通过")
    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != ROLE_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return current_user


def require_researcher(current_user=Depends(get_current_user)):
    if current_user.role not in (ROLE_ADMIN, ROLE_RESEARCHER):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要研究员或以上权限")
    return current_user
