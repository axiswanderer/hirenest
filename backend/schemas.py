from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# --- 1. PROFILE SCHEMAS ---
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

# --- 2. USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    is_recruiter: bool = False

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_recruiter: bool
    profile: Optional[ProfileResponse] = None
    class Config:
        from_attributes = True

# --- 3. JOB SCHEMAS ---
class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    location: str

class JobResponse(JobCreate):
    id: int
    recruiter_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- 4. APPLICATION SCHEMAS ---
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
    status: str

# --- 5. MESSAGE SCHEMAS ---
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