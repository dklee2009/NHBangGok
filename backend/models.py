from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    stamps = relationship("Stamp", back_populates="user", cascade="all, delete-orphan")


class Stamp(Base):
    __tablename__ = "stamps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sido_name = Column(String, nullable=False)
    sigungu_name = Column(String, nullable=False)
    branch_id = Column(String, nullable=False)
    branch_name = Column(String, nullable=False)
    visited_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="stamps")

    __table_args__ = (
        UniqueConstraint("user_id", "branch_id", name="uq_user_branch"),
    )