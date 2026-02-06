from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from routers import auth, jobs, applications, profile, messages

# Create Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow Frontend (React) to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Resumes via URL (e.g. localhost:8000/static/resume.pdf)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(profile.router)
app.include_router(messages.router)