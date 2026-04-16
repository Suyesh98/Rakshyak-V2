import json
import uuid
from pathlib import Path
from app.core.security import hash_password
from app.schemas.schemas import UserRegisterRequest

USERS_FILE = Path("users.json")


def _read_users() -> list:
    if not USERS_FILE.exists():
        return []
    with open(USERS_FILE, "r") as f:
        return json.load(f)


def _write_users(users: list) -> None:
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def get_user_by_email(email: str):
    for u in _read_users():
        if u["email"].lower() == email.lower():
            return u
    return None


def get_user_by_username(username: str):
    for u in _read_users():
        if u["username"].lower() == username.lower():
            return u
    return None


def get_user_by_id(user_id: str):
    for u in _read_users():
        if u["id"] == user_id:
            return u
    return None


def update_user(user_id: str, updates: dict) -> dict:
    users = _read_users()
    for u in users:
        if u["id"] == user_id:
            for key, value in updates.items():
                if value is not None:
                    u[key] = value
            _write_users(users)
            return u
    return None


def create_user(data: UserRegisterRequest) -> dict:
    users = _read_users()
    new_user = {
        "id": str(uuid.uuid4()),
        "full_name": data.full_name,
        "email": data.email.lower(),
        "username": data.username.lower(),
        "hashed_password": hash_password(data.password),
        "is_active": True,
    }
    users.append(new_user)
    _write_users(users)
    return new_user
