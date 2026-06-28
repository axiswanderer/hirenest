import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
import models, schemas

router = APIRouter(prefix="/profile", tags=["Profile"])

AVATAR_DIR = os.path.join("uploads", "avatars")
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB

os.makedirs(AVATAR_DIR, exist_ok=True)


def _validate_avatar(file: UploadFile) -> None:
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS or file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 5 MB")


@router.get("/", response_model=schemas.ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
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
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)

    if full_name is not None:
        profile.full_name = full_name[:200]
    if phone is not None:
        profile.phone = phone[:20]
    if portfolio is not None:
        profile.portfolio = portfolio[:500]
    if bio is not None:
        profile.bio = bio[:2000]

    if file and file.filename:
        _validate_avatar(file)
        ext = file.filename.rsplit(".", 1)[-1].lower()
        filename = f"avatar_{current_user.id}_{uuid.uuid4()}.{ext}"
        file_path = os.path.join(AVATAR_DIR, filename)
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except OSError as exc:
            raise HTTPException(status_code=500, detail="Failed to save avatar") from exc
        # Remove old avatar if it exists
        if profile.avatar_url:
            old_path = os.path.join(AVATAR_DIR, profile.avatar_url)
            if os.path.exists(old_path):
                os.remove(old_path)
        profile.avatar_url = filename

    db.commit()
    db.refresh(profile)
    return profile
