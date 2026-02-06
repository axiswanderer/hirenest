from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
import crud, models, schemas, shutil, os, uuid
from pydantic import BaseModel

router = APIRouter(prefix="/applications", tags=["Applications"])
UPLOAD_DIR = "uploads"

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# --- 1. APPLY FOR JOB (Applicant) ---
@router.post("/", response_model=schemas.ApplicationResponse)
def apply_for_job(
    job_id: int = Form(...),
    applicant_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.is_recruiter:
        raise HTTPException(status_code=400, detail="Recruiters cannot apply for jobs")

    # Save PDF
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return crud.create_application(db, job_id, current_user.id, applicant_name, file_path)

# --- 2. GET MY APPLICATIONS (Applicant) ---
# CRITICAL: This MUST be defined BEFORE the /{job_id} endpoint!
@router.get("/me", response_model=List[schemas.ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.is_recruiter:
        raise HTTPException(status_code=400, detail="Recruiters do not have applications")
    
    return db.query(models.Application).filter(models.Application.applicant_id == current_user.id).all()

# --- 3. GET APPLICANTS FOR A JOB (Recruiter) ---
@router.get("/{job_id}", response_model=List[schemas.ApplicationResponse])
def get_job_applications(
    job_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 1. Check if job exists
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 2. Security: Only the Recruiter who posted the job can see applicants
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")

    return crud.get_applications_for_job(db, job_id)

# Class for the request body
class StatusUpdate(BaseModel):
    status: str

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Get Application
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # 2. Security: Verify the current user is the Recruiter who owns this job
    job = db.query(models.Job).filter(models.Job.id == application.job_id).first()
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 3. Update
    application.status = status_update.status
    db.commit()
    db.refresh(application)
    return application