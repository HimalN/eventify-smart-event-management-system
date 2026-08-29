"""User model."""

from sqlalchemy import Column, Integer, String
from app.database.base import Base, TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="participant")  # admin | organizer | participant
    department = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active | invited | suspended
    avatar_hue = Column(Integer, nullable=True, default=0)
