from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db_session
from .. import models
from ..schemas import UserRead, ResolveRoleRequest
from ..config import settings

router = APIRouter(prefix="/users", tags=["users"])


ROLE_STUDENT = "student"
ROLE_TEACHER = "teacher"
ROLE_COORDINATOR = "coordinator"


EMAIL_ROLE_CACHE = {}


def resolve_role_by_email(email: str) -> str:
    email_l = email.lower()
    if email_l in EMAIL_ROLE_CACHE:
        return EMAIL_ROLE_CACHE[email_l]

    coordinator_set = {e.strip().lower() for e in settings.coordinator_emails}
    teacher_set = {e.strip().lower() for e in settings.teacher_emails}

    if email_l in coordinator_set:
        role = ROLE_COORDINATOR
    elif email_l in teacher_set:
        role = ROLE_TEACHER
    else:
        role = ROLE_STUDENT

    EMAIL_ROLE_CACHE[email_l] = role
    return role


@router.get("/health")
def health():
    return {"status": "ok", "service": "users"}


@router.post("/resolve", response_model=UserRead)
def resolve_user(req: ResolveRoleRequest, db: Session = Depends(get_db_session)):
    email = req.email.lower()
    role = resolve_role_by_email(email)

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        user = models.User(email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.role != role:
            user.role = role
            db.commit()
            db.refresh(user)

    return user


@router.get("/me", response_model=UserRead)
def get_me(email: str, db: Session = Depends(get_db_session)):
    """Fetch or create the user by email and resolve role via settings lists.
    This aligns with the README which references `/users/me`.
    """
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    e = email.lower()
    role = resolve_role_by_email(e)

    user = db.query(models.User).filter(models.User.email == e).first()
    if user is None:
        user = models.User(email=e, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.role != role:
            user.role = role
            db.commit()
            db.refresh(user)

    return user
