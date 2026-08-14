from pydantic import BaseModel
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime
    model_config = {"from_attributes": True}


class StampCreate(BaseModel):
    sido_name: str
    sigungu_name: str
    branch_id: str
    branch_name: str


class StampOut(BaseModel):
    id: int
    sido_name: str
    sigungu_name: str
    branch_id: str
    branch_name: str
    visited_at: datetime
    model_config = {"from_attributes": True}