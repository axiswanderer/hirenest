from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
import models, schemas, shutil, os, uuid

router = APIRouter(prefix="/profile", tags=["Profile"])
UPLOAD_DIR = "uploads"

@router.get("/", response_model=schemas.ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        # Create empty profile if none exists
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/", response_model=schemas.ProfileResponse)
def update_profile(
    full_name: str = Form(None),
    phone: str = Form(None),
    portfolio: str = Form(None),
    bio: str = Form(None),
    file: UploadFile = File(None), # Optional Profile Pic
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)
    
    # Update text fields if provided
    if full_name: profile.full_name = full_name
    if phone: profile.phone = phone
    if portfolio: profile.portfolio = portfolio
    if bio: profile.bio = bio

    # Handle Avatar Upload
    if file:
        file_ext = file.filename.split(".")[-1]
        filename = f"avatar_{current_user.id}_{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        profile.avatar_url = file_path # Save path

    db.commit()
    db.refresh(profile)
    return profile