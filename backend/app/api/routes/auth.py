from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.schemas.schemas import (
    UserRegisterRequest,
    UserUpdateRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
)
from app.services.user_service import (
    get_user_by_email,
    get_user_by_username,
    create_user,
    update_user,
)
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    blacklist_token,
)
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegisterRequest):
    if get_user_by_email(data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
    if get_user_by_username(data.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken.")

    create_user(data)
    return {"message": "Account created successfully. Please log in."}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    user = get_user_by_username(data.username_or_email) or get_user_by_email(data.username_or_email)

    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    if not user.get("is_active", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated.")

    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "username": user["username"],
        },
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshTokenRequest):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    new_access = create_access_token(data={"sub": payload["sub"]})
    new_refresh = create_refresh_token(data={"sub": payload["sub"]})

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": {"id": payload["sub"]},
    }


@router.post("/logout", response_model=MessageResponse)
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    blacklist_token(credentials.credentials)
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "username": user["username"],
        "is_active": user["is_active"],
    }


@router.put("/profile", response_model=UserResponse)
def update_profile(data: UserUpdateRequest, user: dict = Depends(get_current_user)):
    if data.email and data.email.lower() != user["email"]:
        existing = get_user_by_email(data.email)
        if existing and existing["id"] != user["id"]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use.")

    if data.username and data.username.lower() != user["username"]:
        existing = get_user_by_username(data.username)
        if existing and existing["id"] != user["id"]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken.")

    updates = {}
    if data.full_name is not None:
        updates["full_name"] = data.full_name
    if data.email is not None:
        updates["email"] = data.email.lower()
    if data.username is not None:
        updates["username"] = data.username.lower()

    updated = update_user(user["id"], updates)
    return {
        "id": updated["id"],
        "full_name": updated["full_name"],
        "email": updated["email"],
        "username": updated["username"],
        "is_active": updated["is_active"],
    }
