import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from core.database import get_db
from core.security import get_current_user
import crud, schemas, models

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# NOTE: all fixed-path routes must appear before /{job_id} to avoid shadowing.

@router.get("/my-jobs", response_model=List[schemas.JobResponse])
def get_my_jobs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can view their jobs")
    return db.query(models.Job).options(
        joinedload(models.Job.recruiter).joinedload(models.User.profile)
    ).filter(models.Job.recruiter_id == current_user.id).all()


@router.get("/saved", response_model=List[schemas.SavedJobResponse])
def get_saved_jobs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Recruiters cannot save jobs")
    return crud.get_saved_jobs(db, current_user.id)


@router.get("/count")
def count_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    company: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return {"total": crud.get_jobs_count(db, q=q, location=location, company=company)}


@router.get("/", response_model=List[schemas.JobResponse])
def read_jobs(
    skip: int = 0,
    limit: int = 10,
    q: Optional[str] = None,
    location: Optional[str] = None,
    company: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_jobs(db, skip=skip, limit=limit, q=q, location=location, company=company)


@router.post("/", response_model=schemas.JobResponse)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
    return crud.create_job(db, job, current_user.id)


@router.post("/{job_id}/save", response_model=schemas.SavedJobResponse)
def save_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Recruiters cannot save jobs")
    if not db.query(models.Job).filter(models.Job.id == job_id).first():
        raise HTTPException(status_code=404, detail="Job not found")
    return crud.save_job(db, current_user.id, job_id)


@router.delete("/{job_id}/save")
def unsave_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    crud.unsave_job(db, current_user.id, job_id)
    return Response(status_code=204)


@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).options(
        joinedload(models.Job.recruiter).joinedload(models.User.profile)
    ).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Delete resume files
    for app in job.applications:
        if app.resume_path:
            path = os.path.join("uploads", "resumes", app.resume_path)
            if os.path.exists(path):
                os.remove(path)
    db.delete(job)
    db.commit()
    return Response(status_code=204)
