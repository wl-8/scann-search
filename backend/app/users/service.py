from sqlalchemy.orm import Session
from app.auth.models import User
from app.auth.constants import (
    ROLE_ADMIN, ROLE_USER, ROLE_RESEARCHER,
    REVIEW_APPROVED, REVIEW_REJECTED, REVIEW_PENDING,
    ACCOUNT_NORMAL, ACCOUNT_BANNED,
)
from app.users.schemas import UserUpdate
from app.users.exceptions import UserNotFoundError, CannotModifyAdminError, InvalidRoleError
from app.core.security import hash_password


def _get_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UserNotFoundError()
    return user


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def list_pending(db: Session) -> list[User]:
    return db.query(User).filter(User.review_status == REVIEW_PENDING).order_by(User.created_at).all()


def update_me(db: Session, user: User, payload: UserUpdate) -> User:
    if payload.email is not None:
        user.email = payload.email
    if payload.password is not None:
        user.hashed_password = hash_password(payload.password)
    db.commit()
    db.refresh(user)
    return user


def approve(db: Session, user_id: int) -> User:
    user = _get_or_404(db, user_id)
    user.review_status = REVIEW_APPROVED
    user.account_status = ACCOUNT_NORMAL
    db.commit()
    db.refresh(user)
    return user


def reject(db: Session, user_id: int) -> User:
    user = _get_or_404(db, user_id)
    user.review_status = REVIEW_REJECTED
    db.commit()
    db.refresh(user)
    return user


def ban(db: Session, user_id: int) -> User:
    user = _get_or_404(db, user_id)
    if user.role == ROLE_ADMIN:
        raise CannotModifyAdminError()
    user.account_status = ACCOUNT_BANNED
    db.commit()
    db.refresh(user)
    return user


def unban(db: Session, user_id: int) -> User:
    user = _get_or_404(db, user_id)
    user.account_status = ACCOUNT_NORMAL
    db.commit()
    db.refresh(user)
    return user


def set_role(db: Session, user_id: int, role: str) -> User:
    if role not in (ROLE_USER, ROLE_RESEARCHER):
        raise InvalidRoleError()
    user = _get_or_404(db, user_id)
    if user.role == ROLE_ADMIN:
        raise CannotModifyAdminError()
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user_id: int) -> None:
    user = _get_or_404(db, user_id)
    if user.role == ROLE_ADMIN:
        raise CannotModifyAdminError()
    db.delete(user)
    db.commit()
