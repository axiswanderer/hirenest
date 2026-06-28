import os
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.database import SessionLocal
from core.ws_manager import manager
import models, crud

SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"

router = APIRouter(tags=["WebSocket"])


def _get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        return db.query(models.User).filter(models.User.email == email).first()
    except JWTError:
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    db = SessionLocal()
    try:
        user = _get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001)
            return

        await manager.connect(user.id, websocket)
        try:
            while True:
                data = await websocket.receive_json()

                if data.get("type") == "message":
                    msg_data = data.get("data", {})
                    receiver_id = msg_data.get("receiver_id")
                    content = msg_data.get("content", "").strip()
                    if not receiver_id or not content:
                        continue

                    new_msg = models.Message(
                        sender_id=user.id,
                        receiver_id=receiver_id,
                        content=content,
                    )
                    db.add(new_msg)
                    db.commit()
                    db.refresh(new_msg)

                    payload = {
                        "type": "message",
                        "data": {
                            "id": new_msg.id,
                            "sender_id": new_msg.sender_id,
                            "receiver_id": new_msg.receiver_id,
                            "content": new_msg.content,
                            "timestamp": new_msg.timestamp.isoformat(),
                        },
                    }
                    await manager.send_to_user(receiver_id, payload)
                    await manager.send_to_user(user.id, payload)

                    # Notify receiver
                    sender_name = user.profile.full_name if user.profile else user.email
                    notif = crud.create_notification(
                        db, receiver_id, "new_message",
                        f"New message from {sender_name}",
                        related_id=new_msg.id,
                    )
                    await manager.send_to_user(receiver_id, {
                        "type": "notification",
                        "data": {
                            "id": notif.id,
                            "type": notif.type,
                            "content": notif.content,
                            "is_read": notif.is_read,
                            "created_at": notif.created_at.isoformat(),
                        },
                    })

        except WebSocketDisconnect:
            pass
    finally:
        manager.disconnect(user.id if user else -1)
        db.close()
