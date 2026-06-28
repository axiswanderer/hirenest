from typing import Optional
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
import models, schemas
from core.security import get_password_hash


# --- USER ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pw, is_recruiter=user.is_recruiter)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- JOBS ---
def _job_query(db: Session, q: Optional[str] = None, location: Optional[str] = None, company: Optional[str] = None):
    query = db.query(models.Job).options(
        joinedload(models.Job.recruiter).joinedload(models.User.profile)
    )
    if q:
        query = query.filter(models.Job.title.ilike(f"%{q}%"))
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    if company:
        query = query.filter(models.Job.company.ilike(f"%{company}%"))
    return query

def get_jobs(db: Session, skip: int = 0, limit: int = 10,
             q: Optional[str] = None, location: Optional[str] = None, company: Optional[str] = None):
    limit = min(limit, 100)
    return _job_query(db, q, location, company).order_by(models.Job.created_at.desc()).offset(skip).limit(limit).all()

def get_jobs_count(db: Session, q: Optional[str] = None, location: Optional[str] = None, company: Optional[str] = None) -> int:
    query = db.query(func.count(models.Job.id))
    if q:
        query = query.filter(models.Job.title.ilike(f"%{q}%"))
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    if company:
        query = query.filter(models.Job.company.ilike(f"%{company}%"))
    return query.scalar()

def create_job(db: Session, job: schemas.JobCreate, recruiter_id: int):
    db_job = models.Job(**job.dict(), recruiter_id=recruiter_id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


# --- APPLICATIONS ---
def create_application(db: Session, job_id: int, user_id: int, name: str, resume_path: str):
    db_app = models.Application(
        job_id=job_id, applicant_id=user_id, applicant_name=name, resume_path=resume_path,
    )
    db.add(db_app)
    try:
        db.commit()
        db.refresh(db_app)
        return db_app
    except IntegrityError:
        db.rollback()
        raise

def get_applications_for_job(db: Session, job_id: int):
    return db.query(models.Application).filter(models.Application.job_id == job_id).all()


# --- SAVED JOBS ---
def save_job(db: Session, user_id: int, job_id: int) -> models.SavedJob:
    saved = models.SavedJob(user_id=user_id, job_id=job_id)
    db.add(saved)
    try:
        db.commit()
        db.refresh(saved)
        return saved
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Job already saved")

def unsave_job(db: Session, user_id: int, job_id: int):
    saved = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == user_id,
        models.SavedJob.job_id == job_id
    ).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved job not found")
    db.delete(saved)
    db.commit()

def get_saved_jobs(db: Session, user_id: int):
    return db.query(models.SavedJob).filter(models.SavedJob.user_id == user_id).options(
        joinedload(models.SavedJob.job).joinedload(models.Job.recruiter).joinedload(models.User.profile)
    ).all()


# --- NOTIFICATIONS ---
def create_notification(db: Session, user_id: int, type: str, content: str, related_id: int = None) -> models.Notification:
    notif = models.Notification(user_id=user_id, type=type, content=content, related_id=related_id)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
