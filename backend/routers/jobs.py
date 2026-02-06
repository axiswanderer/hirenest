from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
import crud, schemas, models

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# --- 1. GET MY JOBS (Recruiter) ---
# CRITICAL: This MUST be defined BEFORE generic /{id} endpoints
@router.get("/my-jobs", response_model=List[schemas.JobResponse])
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can view their jobs")
    # Filters jobs where recruiter_id matches the logged-in user
    return db.query(models.Job).filter(models.Job.recruiter_id == current_user.id).all()

# --- 2. GET ALL JOBS (Public) ---
@router.get("/", response_model=List[schemas.JobResponse])
def read_jobs(db: Session = Depends(get_db)):
    return crud.get_jobs(db)

# --- 3. CREATE JOB (Recruiter) ---
@router.post("/", response_model=schemas.JobResponse)
def create_job(
    job: schemas.JobCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
    return crud.create_job(db, job, current_user.id)

# --- 4. GET JOB BY ID (Public) ---
@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job