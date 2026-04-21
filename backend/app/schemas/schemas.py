import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


# ─────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    username: str
    password: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return v.strip()

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-z0-9_]{3,20}$", v):
            raise ValueError(
                "Username must be 3-20 characters, lowercase letters, numbers, and underscores only."
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        return v


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    username: str
    is_active: bool


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return v.strip() if v else v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if v is not None and not re.match(r"^[a-z0-9_]{3,20}$", v):
            raise ValueError(
                "Username must be 3-20 characters, lowercase letters, numbers, and underscores only."
            )
        return v


class MessageResponse(BaseModel):
    message: str
