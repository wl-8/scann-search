from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.users import service
from app.users.schemas import UserResponse, UserUpdate, UserListResponse
from app.auth.models import User
from app.core.dependencies import get_db, get_current_user, require_admin

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_me(db, current_user, payload)


@router.get("", response_model=UserListResponse)
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = service.list_users(db)
    return UserListResponse(total=len(users), items=users)


@router.get("/pending", response_model=UserListResponse)
def list_pending(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = service.list_pending(db)
    return UserListResponse(total=len(users), items=users)


@router.put("/{user_id}/role", response_model=UserResponse)
def set_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return service.set_role(db, user_id, role)


@router.post("/{user_id}/approve", response_model=UserResponse)
def approve(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return service.approve(db, user_id)


@router.post("/{user_id}/reject", response_model=UserResponse)
def reject(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return service.reject(db, user_id)


@router.post("/{user_id}/ban", response_model=UserResponse)
def ban(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return service.ban(db, user_id)


@router.post("/{user_id}/unban", response_model=UserResponse)
def unban(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return service.unban(db, user_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    service.delete(db, user_id)
    return None
