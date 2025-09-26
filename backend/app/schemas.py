from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    role: str


class UserCreate(BaseModel):
    email: EmailStr


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True


class ResolveRoleRequest(BaseModel):
    email: EmailStr


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "backend"
