import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from services.ai_screening import extract_pdf_text, screen_resume
import models

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/screen/{application_id}")
def screen_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can use AI screening")

    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=503, detail="AI screening is not configured (missing ANTHROPIC_API_KEY)")

    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(models.Job).filter(models.Job.id == application.job_id).first()
    if not job or job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    file_path = os.path.join("uploads", "resumes", application.resume_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")

    try:
        resume_text = extract_pdf_text(file_path)
        if not resume_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from resume (scanned PDF?)")
        return screen_resume(resume_text, job.title, job.description)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI screening failed: {str(e)}")
