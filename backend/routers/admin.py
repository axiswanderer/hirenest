import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from typing import List
from core.database import get_db
from core.security import get_current_user
import models, schemas

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")


def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/bootstrap")
def bootstrap_admin(
    secret: str = Query(...),
    user_email: str = Query(...),
    db: Session = Depends(get_db),
):
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"ok": True, "message": f"{user_email} is now an admin"}


@router.get("/stats", response_model=schemas.AdminStatsResponse)
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total_users = db.query(func.count(models.User.id)).scalar()
    total_jobs = db.query(func.count(models.Job.id)).scalar()
    total_applications = db.query(func.count(models.Application.id)).scalar()
    recruiter_count = db.query(func.count(models.User.id)).filter(models.User.is_recruiter == True).scalar()
    applicant_count = total_users - recruiter_count
    return {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "recruiter_count": recruiter_count,
        "applicant_count": applicant_count,
    }


@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(models.User).options(joinedload(models.User.profile)).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Delete messages manually (can have two FK references)
    db.query(models.Message).filter(
        or_(models.Message.sender_id == user_id, models.Message.receiver_id == user_id)
    ).delete()
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/jobs", response_model=List[schemas.JobResponse])
def list_all_jobs(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(models.Job).options(
        joinedload(models.Job.recruiter).joinedload(models.User.profile)
    ).order_by(models.Job.created_at.desc()).all()


@router.delete("/jobs/{job_id}")
def admin_delete_job(job_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"ok": True}
