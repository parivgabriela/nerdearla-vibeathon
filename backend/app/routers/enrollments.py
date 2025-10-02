from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from ..db import get_db_session
from .. import models
from ..schemas import EnrollmentCreate, EnrollmentRead

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("/", response_model=List[EnrollmentRead])
def get_enrollments(
    skip: int = 0,
    limit: int = 100,
    student_id: int = None,
    course_id: int = None,
    db: Session = Depends(get_db_session)
):
    """Get all enrollments with optional filtering."""
    query = db.query(models.Enrollment)

    if student_id:
        query = query.filter(models.Enrollment.student_id == student_id)

    if course_id:
        query = query.filter(models.Enrollment.course_id == course_id)

    enrollments = query.offset(skip).limit(limit).all()
    return enrollments


@router.get("/{enrollment_id}", response_model=EnrollmentRead)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db_session)):
    """Get a specific enrollment by ID."""
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.id == enrollment_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    return enrollment


@router.post("/", response_model=EnrollmentRead)
def create_enrollment(enrollment: EnrollmentCreate, db: Session = Depends(get_db_session)):
    """Enroll a student in a course."""
    # Verify student exists
    student = db.query(models.User).filter(models.User.id == enrollment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify course exists
    course = db.query(models.Course).filter(models.Course.id == enrollment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if enrollment already exists
    existing = db.query(models.Enrollment).filter(
        and_(
            models.Enrollment.student_id == enrollment.student_id,
            models.Enrollment.course_id == enrollment.course_id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")

    db_enrollment = models.Enrollment(**enrollment.dict())
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)

    return db_enrollment


@router.delete("/{enrollment_id}")
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db_session)):
    """Unenroll a student from a course."""
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.id == enrollment_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    db.delete(enrollment)
    db.commit()

    return {"message": "Student unenrolled successfully"}
