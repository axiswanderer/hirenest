from sqlalchemy.orm import Session
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
def create_job(db: Session, job: schemas.JobCreate, recruiter_id: int):
    # We unpack the job data (**job.dict()) and add the recruiter_id
    db_job = models.Job(**job.dict(), recruiter_id=recruiter_id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_jobs(db: Session):
    return db.query(models.Job).all()

# --- APPLICATIONS ---
def create_application(db: Session, job_id: int, user_id: int, name: str, resume_path: str):
    # 'status' is automatically set to "Pending" by models.py default
    db_app = models.Application(
        job_id=job_id, 
        applicant_id=user_id, 
        applicant_name=name, 
        resume_path=resume_path
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

def get_applications_for_job(db: Session, job_id: int):
    return db.query(models.Application).filter(models.Application.job_id == job_id).all()