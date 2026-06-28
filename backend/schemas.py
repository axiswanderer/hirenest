from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


# --- PROFILE ---
class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    portfolio: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class ProfileBrief(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    class Config:
        from_attributes = True


# --- USER ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    is_recruiter: bool = False

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

class RecruiterBrief(BaseModel):
    id: int
    email: EmailStr
    profile: Optional[ProfileBrief] = None
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_recruiter: bool
    is_admin: bool = False
    profile: Optional[ProfileResponse] = None
    class Config:
        from_attributes = True


# --- JOB ---
class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    location: str

class JobResponse(JobCreate):
    id: int
    recruiter_id: int
    created_at: datetime
    recruiter: Optional[RecruiterBrief] = None
    class Config:
        from_attributes = True


# --- APPLICATION ---
class ApplicationStatus(str, Enum):
    pending = "Pending"
    interviewing = "Interviewing"
    accepted = "Accepted"
    rejected = "Rejected"

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    applicant_id: int
    resume_path: str
    status: str
    applicant_name: Optional[str] = None
    applicant: Optional[UserResponse] = None
    job: Optional[JobResponse] = None
    class Config:
        from_attributes = True

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


# --- SAVED JOB ---
class SavedJobResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    saved_at: datetime
    job: Optional[JobResponse] = None
    class Config:
        from_attributes = True


# --- NOTIFICATION ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    content: str
    is_read: bool
    related_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- MESSAGE ---
class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime
    class Config:
        from_attributes = True


# --- ADMIN ---
class AdminStatsResponse(BaseModel):
    total_users: int
    total_jobs: int
    total_applications: int
    recruiter_count: int
    applicant_count: int
