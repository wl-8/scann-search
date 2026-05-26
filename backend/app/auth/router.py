from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.auth import service
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.auth.models import User
from app.core.dependencies import get_db, get_current_user

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    user = service.register_user(db, req)
    return {"message": "注册成功，请等待管理员审核", "user_id": user.id}


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return service.login_user(db, req)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_: User = Depends(get_current_user)):
    # JWT 无状态，客户端丢弃 token 即可
    return None


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
