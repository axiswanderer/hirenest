import os
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from core.database import engine, Base, get_db
from core.security import get_current_user
from routers import auth, jobs, applications, profile, messages
import models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HireNest API")

# Security headers on every response
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Only serve avatars publicly (profile pictures); resumes require auth (see /files/resume/)
os.makedirs(os.path.join("uploads", "avatars"), exist_ok=True)
os.makedirs(os.path.join("uploads", "resumes"), exist_ok=True)
app.mount("/static/avatars", StaticFiles(directory=os.path.join("uploads", "avatars")), name="avatars")

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(profile.router)
app.include_router(messages.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/files/resume/{filename}")
def download_resume(filename: str, current_user: models.User = Depends(get_current_user)):
    # Prevent path traversal attacks
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = os.path.join("uploads", "resumes", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume not found")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)
