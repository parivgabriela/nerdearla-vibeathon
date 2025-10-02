from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..db import get_db_session
from .. import models
from ..schemas import (
    NotificationCreate,
    NotificationUpdate,
    NotificationRead,
    MarkReadRequest,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationRead])
def list_notifications(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    is_read: Optional[bool] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db_session),
):
    q = db.query(models.Notification)
    if user_id is not None:
        q = q.filter(models.Notification.user_id == user_id)
    if is_read is not None:
        q = q.filter(models.Notification.is_read == is_read)
    if category is not None:
        q = q.filter(models.Notification.category == category)
    return q.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(notification_id: int, db: Session = Depends(get_db_session)):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return n


@router.post("/", response_model=NotificationRead)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db_session)):
    # Ensure user exists
    u = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    n = models.Notification(**payload.dict())
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.put("/{notification_id}", response_model=NotificationRead)
def update_notification(notification_id: int, payload: NotificationUpdate, db: Session = Depends(get_db_session)):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(n, k, v)
    db.commit()
    db.refresh(n)
    return n


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(notification_id: int, payload: MarkReadRequest, db: Session = Depends(get_db_session)):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = payload.is_read
    db.commit()
    db.refresh(n)
    return n


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db_session)):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(n)
    db.commit()
    return {"message": "Notification deleted"}


@router.get("/alerts/upcoming", response_model=List[NotificationRead])
def alerts_upcoming(
    user_id: int = Query(..., description="Student user id"),
    within_hours: int = 48,
    db: Session = Depends(get_db_session),
):
    """
    Generate (non-persistent) upcoming assignment alerts for a student based on enrollments.
    Returns Notification-like objects without saving them.
    """
    # Validate user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    until = now + timedelta(hours=within_hours)

    # Courses where the user is enrolled
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.student_id == user_id).all()
    course_ids = [e.course_id for e in enrollments]
    if not course_ids:
        return []

    # Assignments due soon
    assignments = (
        db.query(models.Assignment)
        .filter(models.Assignment.course_id.in_(course_ids))
        .filter(models.Assignment.is_active == True)  # noqa: E712
        .filter(models.Assignment.due_date.isnot(None))
        .filter(models.Assignment.due_date >= now)
        .filter(models.Assignment.due_date <= until)
        .all()
    )

    alerts: List[models.Notification] = []
    for a in assignments:
        alerts.append(
            models.Notification(
                id=0,  # will be ignored on serialization
                user_id=user_id,
                title=f"Entrega próxima: {a.title}",
                content=(a.description or "")[:500],
                category="deadline",
                is_read=False,
                related_assignment_id=a.id,
                due_date=a.due_date,
                created_at=now,
                updated_at=now,
            )
        )

    # Convert to read schema via pydantic by reusing fields
    result: List[NotificationRead] = []
    for n in alerts:
        result.append(
            NotificationRead(
                id=n.id or 0,
                user_id=n.user_id,
                title=n.title,
                content=n.content,
                category=n.category,
                is_read=n.is_read,
                related_assignment_id=n.related_assignment_id,
                due_date=n.due_date,
                created_at=n.created_at,
                updated_at=n.updated_at,
            )
        )
    return result


@router.get("/alerts/overdue", response_model=List[NotificationRead])
def alerts_overdue(
    user_id: int = Query(..., description="Student user id"),
    db: Session = Depends(get_db_session),
):
    """
    Generate (non-persistent) overdue assignment alerts for a student based on enrollments.
    Returns Notification-like objects without saving them.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()

    enrollments = db.query(models.Enrollment).filter(models.Enrollment.student_id == user_id).all()
    course_ids = [e.course_id for e in enrollments]
    if not course_ids:
        return []

    # Assignments overdue (past due_date) and active
    assignments = (
        db.query(models.Assignment)
        .filter(models.Assignment.course_id.in_(course_ids))
        .filter(models.Assignment.is_active == True)  # noqa: E712
        .filter(models.Assignment.due_date.isnot(None))
        .filter(models.Assignment.due_date < now)
        .all()
    )

    alerts: List[NotificationRead] = []
    for a in assignments:
        alerts.append(
            NotificationRead(
                id=0,
                user_id=user_id,
                title=f"Entrega vencida: {a.title}",
                content=(a.description or "")[:500],
                category="deadline_overdue",
                is_read=False,
                related_assignment_id=a.id,
                due_date=a.due_date,
                created_at=now,
                updated_at=now,
            )
        )

    return alerts
