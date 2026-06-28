import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from core.database import get_db
from core.security import get_current_user
from core.ws_manager import manager
import crud, models, schemas

router = APIRouter(prefix="/applications", tags=["Applications"])

RESUME_DIR = os.path.join("uploads", "resumes")
ALLOWED_EXTENSIONS = {"pdf"}
ALLOWED_CONTENT_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

os.makedirs(RESUME_DIR, exist_ok=True)


def _validate_resume(file: UploadFile) -> None:
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB")


# --- 1. APPLY FOR JOB ---
@router.post("/", response_model=schemas.ApplicationResponse)
def apply_for_job(
    background_tasks: BackgroundTasks,
    job_id: int = Form(...),
    applicant_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Recruiters cannot apply for jobs")

    _validate_resume(file)

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(RESUME_DIR, filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to save resume") from exc

    try:
        new_app = crud.create_application(db, job_id, current_user.id, applicant_name, filename)
    except IntegrityError:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Notify recruiter
    sender_name = current_user.profile.full_name if current_user.profile else current_user.email
    notif = crud.create_notification(
        db, job.recruiter_id, "new_application",
        f"New application for '{job.title}' from {sender_name}",
        related_id=new_app.id,
    )
    background_tasks.add_task(manager.send_to_user, job.recruiter_id, {
        "type": "notification",
        "data": {"id": notif.id, "type": notif.type, "content": notif.content, "is_read": False},
    })

    return new_app


# --- 2. GET MY APPLIED JOB IDs ---
# Must be BEFORE /{job_id}
@router.get("/my-job-ids", response_model=List[int])
def get_my_applied_job_ids(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Recruiters do not have applications")
    rows = db.query(models.Application.job_id).filter(
        models.Application.applicant_id == current_user.id
    ).all()
    return [r[0] for r in rows]


# --- 3. GET MY APPLICATIONS ---
@router.get("/me", response_model=List[schemas.ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Recruiters do not have applications")
    return db.query(models.Application).filter(models.Application.applicant_id == current_user.id).all()


# --- 4. GET APPLICANTS FOR A JOB (Recruiter) ---
@router.get("/{job_id}", response_model=List[schemas.ApplicationResponse])
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_applications_for_job(db, job_id)


# --- 5. UPDATE STATUS (Recruiter) ---
@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    background_tasks: BackgroundTasks,
    status_update: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(models.Job).filter(models.Job.id == application.job_id).first()
    if not job or job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    application.status = status_update.status.value
    db.commit()
    db.refresh(application)

    # Notify applicant
    notif = crud.create_notification(
        db, application.applicant_id, "status_change",
        f"Your application for '{job.title}' is now: {status_update.status.value}",
        related_id=application_id,
    )
    background_tasks.add_task(manager.send_to_user, application.applicant_id, {
        "type": "notification",
        "data": {"id": notif.id, "type": notif.type, "content": notif.content, "is_read": False},
    })

    return application


# --- 6. WITHDRAW APPLICATION (Applicant) ---
@router.delete("/{application_id}")
def withdraw_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if application.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending applications can be withdrawn")

    if application.resume_path:
        path = os.path.join(RESUME_DIR, application.resume_path)
        if os.path.exists(path):
            os.remove(path)

    db.delete(application)
    db.commit()
    return Response(status_code=204)
