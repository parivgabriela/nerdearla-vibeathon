from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime
from ..db import get_db_session
from .. import models
from ..schemas import (
    AssignmentCreate, AssignmentUpdate, AssignmentRead,
    SubmissionCreate, SubmissionRead, SubmissionUpdate
)

router = APIRouter(prefix="/assignments", tags=["assignments"])


# Assignment endpoints
@router.get("/", response_model=List[AssignmentRead])
def get_assignments(
    skip: int = 0,
    limit: int = 100,
    course_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db_session)
):
    """Get all assignments with optional filtering."""
    query = db.query(models.Assignment).filter(models.Assignment.is_active == is_active)

    if course_id:
        query = query.filter(models.Assignment.course_id == course_id)

    assignments = query.offset(skip).limit(limit).all()

    # Add submission counts
    for assignment in assignments:
        assignment.submission_count = len(assignment.submissions)

    return assignments


@router.get("/{assignment_id}", response_model=AssignmentRead)
def get_assignment(assignment_id: int, db: Session = Depends(get_db_session)):
    """Get a specific assignment by ID."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.submission_count = len(assignment.submissions)

    return assignment


@router.post("/", response_model=AssignmentRead)
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db_session)):
    """Create a new assignment."""
    # Verify course exists
    course = db.query(models.Course).filter(models.Course.id == assignment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db_assignment = models.Assignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    db_assignment.submission_count = 0

    return db_assignment


@router.put("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdate,
    db: Session = Depends(get_db_session)
):
    """Update an assignment."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    update_data = assignment_update.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(assignment, field, value)

    db.commit()
    db.refresh(assignment)

    assignment.submission_count = len(assignment.submissions)

    return assignment


@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db_session)):
    """Delete an assignment (soft delete by setting is_active=False)."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.is_active = False
    db.commit()

    return {"message": "Assignment deactivated successfully"}


# Submission endpoints
@router.get("/submissions/", response_model=List[SubmissionRead])
def get_submissions(
    skip: int = 0,
    limit: int = 100,
    assignment_id: Optional[str] = None,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db_session)
):
    """Get all submissions with optional filtering."""
    # Coerce potentially empty string query params to proper types
    assignment_id_int: Optional[int] = None
    student_id_int: Optional[int] = None

    if assignment_id is not None and str(assignment_id).strip() != "":
        try:
            assignment_id_int = int(assignment_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="assignment_id debe ser un entero válido")

    if student_id is not None and str(student_id).strip() != "":
        try:
            student_id_int = int(student_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="student_id debe ser un entero válido")

    query = db.query(models.Submission)

    if assignment_id_int is not None:
        query = query.filter(models.Submission.assignment_id == assignment_id_int)

    if student_id_int is not None:
        query = query.filter(models.Submission.student_id == student_id_int)

    submissions = query.offset(skip).limit(limit).all()
    return submissions


@router.get("/submissions/{submission_id}", response_model=SubmissionRead)
def get_submission(submission_id: int, db: Session = Depends(get_db_session)):
    """Get a specific submission by ID."""
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    return submission


@router.post("/submissions/", response_model=SubmissionRead)
def create_submission(submission: SubmissionCreate, db: Session = Depends(get_db_session)):
    """Create a new submission."""
    # Verify assignment exists
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == submission.assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Verify student exists
    student = db.query(models.User).filter(models.User.id == submission.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if submission already exists
    existing = db.query(models.Submission).filter(
        and_(
            models.Submission.assignment_id == submission.assignment_id,
            models.Submission.student_id == submission.student_id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already submitted this assignment")

    db_submission = models.Submission(**submission.dict())
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    return db_submission


@router.put("/submissions/{submission_id}", response_model=SubmissionRead)
def update_submission(
    submission_id: int,
    submission_update: SubmissionUpdate,
    db: Session = Depends(get_db_session)
):
    """Update a submission (for grading and feedback)."""
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    update_data = submission_update.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(submission, field, value)

    db.commit()
    db.refresh(submission)

    return submission


@router.delete("/submissions/{submission_id}")
def delete_submission(submission_id: int, db: Session = Depends(get_db_session)):
    """Delete a submission."""
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    db.delete(submission)
    db.commit()

    return {"message": "Submission deleted successfully"}
