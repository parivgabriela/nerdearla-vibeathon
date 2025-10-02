from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from ..db import get_db_session
from .. import models
from ..schemas import (
    CourseCreate, CourseUpdate, CourseRead,
    EnrollmentCreate, EnrollmentRead,
    AssignmentCreate, AssignmentUpdate, AssignmentRead
)

router = APIRouter(prefix="/courses", tags=["courses"])


# Course endpoints
@router.get("/", response_model=List[CourseRead])
def get_courses(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db_session)
):
    """Get all courses with optional filtering."""
    query = db.query(models.Course).filter(models.Course.is_active == is_active)

    if teacher_id:
        query = query.filter(models.Course.teacher_id == teacher_id)

    courses = query.offset(skip).limit(limit).all()

    # Add enrollment and assignment counts
    for course in courses:
        course.enrollment_count = len(course.enrollments)
        course.assignment_count = len(course.assignments)

    return courses


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db_session)):
    """Get a specific course by ID."""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.enrollment_count = len(course.enrollments)
    course.assignment_count = len(course.assignments)

    return course


@router.post("/", response_model=CourseRead)
def create_course(course: CourseCreate, db: Session = Depends(get_db_session)):
    """Create a new course."""
    # Verify teacher exists
    teacher = db.query(models.User).filter(models.User.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check if google_course_id already exists
    if course.google_course_id:
        existing = db.query(models.Course).filter(
            models.Course.google_course_id == course.google_course_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Google course ID already exists")

    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    db_course.enrollment_count = 0
    db_course.assignment_count = 0

    return db_course


@router.put("/{course_id}", response_model=CourseRead)
def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: Session = Depends(get_db_session)
):
    """Update a course."""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = course_update.dict(exclude_unset=True)

    # Check if google_course_id already exists (if being updated)
    if "google_course_id" in update_data and update_data["google_course_id"]:
        existing = db.query(models.Course).filter(
            and_(
                models.Course.google_course_id == update_data["google_course_id"],
                models.Course.id != course_id
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Google course ID already exists")

    for field, value in update_data.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)

    course.enrollment_count = len(course.enrollments)
    course.assignment_count = len(course.assignments)

    return course


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db_session)):
    """Delete a course (soft delete by setting is_active=False)."""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.is_active = False
    db.commit()

    return {"message": "Course deactivated successfully"}
