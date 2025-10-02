from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


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


# Course schemas
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    google_course_id: Optional[str] = None
    teacher_id: int
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CourseRead(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    teacher: UserRead
    enrollment_count: int = 0
    assignment_count: int = 0

    class Config:
        from_attributes = True


# Enrollment schemas
class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentRead(EnrollmentBase):
    id: int
    enrolled_at: datetime
    student: UserRead
    course: CourseRead

    class Config:
        from_attributes = True


# Assignment schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    due_date: Optional[datetime] = None
    max_score: Optional[float] = None
    is_active: bool = True


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_score: Optional[float] = None
    is_active: Optional[bool] = None


class AssignmentRead(AssignmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    course: CourseRead
    submission_count: int = 0

    class Config:
        from_attributes = True


# Submission schemas
class SubmissionBase(BaseModel):
    assignment_id: int
    student_id: int
    content: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionUpdate(BaseModel):
    content: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None


class SubmissionRead(SubmissionBase):
    id: int
    submitted_at: datetime
    updated_at: datetime
    assignment: AssignmentRead
    student: UserRead

    class Config:
        from_attributes = True


# Announcement schemas
class AnnouncementBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_active: bool = True
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class AnnouncementCreate(AnnouncementBase):
    created_by_id: Optional[int] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class AnnouncementRead(AnnouncementBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Notification schemas
class NotificationBase(BaseModel):
    user_id: int
    title: str
    content: Optional[str] = None
    category: str = "general"
    related_assignment_id: Optional[int] = None
    due_date: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    related_assignment_id: Optional[int] = None
    due_date: Optional[datetime] = None
    is_read: Optional[bool] = None


class NotificationRead(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarkReadRequest(BaseModel):
    is_read: bool = True
