from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db import get_db_session
from .. import models
from ..schemas import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementRead,
)

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/", response_model=List[AnnouncementRead])
def list_announcements(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db_session),
):
    q = db.query(models.Announcement)
    if is_active is not None:
        q = q.filter(models.Announcement.is_active == is_active)
    return q.order_by(models.Announcement.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{announcement_id}", response_model=AnnouncementRead)
def get_announcement(announcement_id: int, db: Session = Depends(get_db_session)):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return a


@router.post("/", response_model=AnnouncementRead)
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db_session)):
    a = models.Announcement(**payload.dict())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.put("/{announcement_id}", response_model=AnnouncementRead)
def update_announcement(announcement_id: int, payload: AnnouncementUpdate, db: Session = Depends(get_db_session)):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db_session)):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found")
    # Soft delete
    a.is_active = False
    db.commit()
    return {"message": "Announcement deactivated"}
