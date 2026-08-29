"""User management service."""

from __future__ import annotations

from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password

def get_users_list(db: Session) -> list[User]:
    return db.query(User).all()

def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def create_system_user(db: Session, data: dict) -> User:
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role=data.get("role", "participant"),
        department=data.get("department"),
        status=data.get("status", "active"),
        avatar_hue=hash(data["email"]) % 360,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_system_user(db: Session, user_id: str, data: dict) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
        
    for field in ["name", "email", "role", "department", "status"]:
        if field in data and data[field] is not None:
            setattr(user, field, data[field])
            
    if "password" in data and data["password"]:
        user.password_hash = hash_password(data["password"])
        
    db.commit()
    db.refresh(user)
    return user

def delete_system_user(db: Session, user_id: str) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
