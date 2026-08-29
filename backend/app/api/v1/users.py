"""User management API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_admin
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return user_service.get_users_list(db)


@router.get("/{id}", response_model=UserResponse)
def get_user(id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = user_service.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(request: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    try:
        return user_service.create_system_user(db, request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/{id}", response_model=UserResponse)
def update_user(id: str, request: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = user_service.update_system_user(db, id, request.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    success = user_service.delete_system_user(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
