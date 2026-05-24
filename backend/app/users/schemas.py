import re
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    review_status: str
    account_status: str
    login_fail_count: int

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 8 or not re.search(r"[A-Z]", v) or not re.search(r"[0-9]", v):
                raise ValueError("密码至少 8 位，需包含大写字母和数字")
        return v


class UserListResponse(BaseModel):
    total: int
    items: list[UserResponse]
