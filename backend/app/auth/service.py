from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.auth.models import User
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.auth.constants import (
    ROLE_USER, REVIEW_PENDING, REVIEW_REJECTED,
    ACCOUNT_NORMAL, ACCOUNT_LOCKED, ACCOUNT_BANNED,
    MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES,
)
from app.auth.exceptions import (
    CredentialsError, AccountLockedError, AccountBannedError,
    ReviewPendingError, ReviewRejectedError,
    UsernameExistsError, EmailExistsError,
)
from app.core.security import hash_password, verify_password, create_access_token


def register_user(db: Session, req: RegisterRequest) -> User:
    if db.query(User).filter(User.username == req.username).first():
        raise UsernameExistsError()
    if db.query(User).filter(User.email == req.email).first():
        raise EmailExistsError()
    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        role=ROLE_USER,
        review_status=REVIEW_PENDING,
        account_status=ACCOUNT_NORMAL,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, req: LoginRequest) -> TokenResponse:
    user: User | None = db.query(User).filter(User.username == req.username).first()

    # 如果锁定已到期，先自动解锁
    if user and user.account_status == ACCOUNT_LOCKED:
        if user.locked_until and datetime.now(timezone.utc).replace(tzinfo=None) >= user.locked_until:
            user.account_status = ACCOUNT_NORMAL
            user.locked_until = None
            user.login_fail_count = 0
            db.commit()

    # 验证密码
    if not user or not verify_password(req.password, user.hashed_password):
        if user:
            user.login_fail_count += 1
            if user.login_fail_count >= MAX_LOGIN_ATTEMPTS:
                user.account_status = ACCOUNT_LOCKED
                user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
        raise CredentialsError()

    # 密码正确后依次检查账号状态
    if user.account_status == ACCOUNT_LOCKED:
        remaining = max(0, int((user.locked_until - datetime.now(timezone.utc).replace(tzinfo=None)).total_seconds() / 60))
        raise AccountLockedError(f"账号已锁定，请 {remaining} 分钟后重试")

    if user.account_status == ACCOUNT_BANNED:
        raise AccountBannedError()

    if user.review_status == REVIEW_PENDING:
        raise ReviewPendingError()

    if user.review_status == REVIEW_REJECTED:
        raise ReviewRejectedError()

    # 登录成功：重置失败计数
    user.login_fail_count = 0
    db.commit()

    token = create_access_token(subject=user.username, role=user.role)
    return TokenResponse(access_token=token)
