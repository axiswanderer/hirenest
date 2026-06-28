from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
from core.database import get_db
from core.security import get_current_user
import models, schemas

router = APIRouter(prefix="/messages", tags=["Messages"])

# Send a Message
@router.post("/", response_model=schemas.MessageResponse)
def send_message(
    msg: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_msg = models.Message(
        sender_id=current_user.id,
        receiver_id=msg.receiver_id,
        content=msg.content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

# List all unique conversations — MUST be before /{other_user_id}
@router.get("/conversations/list")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sent = db.query(models.Message).filter(models.Message.sender_id == current_user.id).all()
    received = db.query(models.Message).filter(models.Message.receiver_id == current_user.id).all()

    conv: dict = {}
    for msg in sent + received:
        other_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        ts = msg.timestamp
        if other_id not in conv or ts > conv[other_id]["timestamp"]:
            conv[other_id] = {"content": msg.content, "timestamp": ts}

    result = []
    for uid, data in conv.items():
        user = db.query(models.User).filter(models.User.id == uid).first()
        if not user:
            continue
        result.append({
            "user_id": uid,
            "email": user.email,
            "full_name": user.profile.full_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "latest_message": data["content"],
            "latest_timestamp": data["timestamp"].isoformat() if data["timestamp"] else None,
        })

    result.sort(key=lambda x: x["latest_timestamp"] or "", reverse=True)
    return result

# Get Chat History with a specific user
@router.get("/{other_user_id}", response_model=List[schemas.MessageResponse])
def get_chat_history(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch messages where (Sender=Me AND Receiver=Other) OR (Sender=Other AND Receiver=Me)
    messages = db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == other_user_id),
            and_(models.Message.sender_id == other_user_id, models.Message.receiver_id == current_user.id)
        )
    ).order_by(models.Message.timestamp.asc()).all()
    
    return messages