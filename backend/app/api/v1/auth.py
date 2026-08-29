"""Authentication API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MeResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(
            db,
            name=request.name,
            email=request.email,
            password=request.password,
            role=request.role,
            department=request.department,
        )
        tokens = auth_service.create_tokens(user)
        # Construct brief user response
        user_brief = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
        }
        return {**tokens, "user": user_brief}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    tokens = auth_service.create_tokens(user)
    user_brief = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
    }
    return {**tokens, "user": user_brief}


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    tokens = auth_service.refresh_access_token(db, request.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    # Decode user details
    from app.core.security import decode_token
    payload = decode_token(request.refresh_token)
    user_id = payload.get("sub") if payload else None
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    user_brief = {
        "id": user.id if user else "",
        "name": user.name if user else "",
        "email": user.email if user else "",
        "role": user.role if user else "",
        "department": user.department if user else None,
    }
    return {**tokens, "user": user_brief}


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # In a real app, this sends an email with a reset link containing a short-lived token.
    # Here we mock it and return a message.
    return {"message": "If this email is registered, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Verify mock token and reset password
    from app.core.security import decode_token, hash_password
    payload = decode_token(request.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )
    user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"message": "Password reset successfully."}
