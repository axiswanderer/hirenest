
# 🚀 HireNest | The Future of Hiring

![HireNest Hero](https://github.com/axiswanderer/hirenest/blob/main/screenshots/hero.png)


> **HireNest** is a modern, full-stack recruitment platform that bridges the gap between talent and opportunity. Built with a robust **FastAPI** backend and a high-performance **React** frontend, it features role-based portals, real-time messaging, and secure application tracking.

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)

</div>

---

## 🌟 Key Features

### 🏢 For Recruiters
* **Smart Job Management:** Post, edit, and close job listings instantly.
* **Applicant Dashboard:** View all candidates in a centralized table with status tracking.
* **Rich Profiles:** Access applicant bios, portfolios, and download PDF resumes (authenticated download).
* **Pipeline Control:** Move candidates from *Pending* → *Interviewing* → *Accepted* or *Rejected*.
* **Direct Messaging:** Chat securely with applicants directly from the dashboard.

### 👨‍💻 For Applicants
* **One-Click Apply:** Upload your resume (PDF, max 10 MB) and apply to multiple roles effortlessly.
* **Application Tracker:** Real-time status updates on all your submitted applications.
* **Professional Profile:** Build a brand with a custom avatar, bio, and portfolio links.
* **Direct Communication:** Message recruiters to follow up on applications.

---

## 📸 Application Demo

| **Recruiter Portal** | **Applicant Profile** |
|:---:|:---:|
| ![Dashboard](https://github.com/axiswanderer/hirenest/blob/main/screenshots/dashboard.png) | ![Profile](https://github.com/axiswanderer/hirenest/blob/main/screenshots/profile.png) |
| *Manage jobs and view candidates* | *Rich profile with portfolio & bio* |

| **Real-time Chat** | **Live Job Board** |
|:---:|:---:|
| ![Chat](https://github.com/axiswanderer/hirenest/blob/main/screenshots/chat.png) | ![Hero](https://github.com/axiswanderer/hirenest/blob/main/screenshots/hero.png) |
| *Direct messaging between parties* | *Modern, responsive landing page* |

---

## 🛠️ Tech Stack

### **Backend (The Engine)**
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) - High-performance, async Python framework.
* **Database:** PostgreSQL with [SQLAlchemy ORM](https://www.sqlalchemy.org/) and connection pooling.
* **Authentication:** OAuth2 with JWT Tokens (expiring access tokens, bcrypt password hashing).
* **Config:** `python-dotenv` — all secrets live in `.env`, never in source code.

### **Frontend (The Interface)**
* **Framework:** [React](https://react.dev/) (Vite) - Blazing fast SPA architecture.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first professional design.
* **Animations:** [Framer Motion](https://www.framer.com/motion/) - Smooth UI transitions.
* **Icons:** [Lucide React](https://lucide.dev/) - Crisp, modern iconography.
* **Networking:** Axios with request/response interceptors (auto-logout on token expiry).

---

## 🚀 Installation & Setup

Follow these steps to set up HireNest locally.

### **Prerequisites**
* Python 3.10+
* Node.js 16+
* PostgreSQL (local install or Docker)

### **1. Clone the Repository**
```bash
git clone https://github.com/axiswanderer/hirenest.git
cd hirenest
```

### **2. Backend Setup**

```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure environment variables:**

```bash
# Copy the example file and fill in your values
cp .env.example .env
```

Open `backend/.env` and set your values:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost/jobportal_db
SECRET_KEY=your-super-secret-key-at-least-32-chars-long
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> ⚠️ Never commit `.env` — it is already in `.gitignore`.

**Database setup:**
1. Ensure PostgreSQL is running.
2. Create a database: `CREATE DATABASE jobportal_db;`
3. Tables are created automatically on first run via SQLAlchemy.

**Run the server:**
```bash
uvicorn main:app --reload
```
API starts at **http://localhost:8000** — interactive docs at **http://localhost:8000/docs**

---

### **3. Frontend Setup**

Open a new terminal and navigate to the frontend directory.

```bash
cd frontend

# Copy env file (edit if your backend runs on a different port)
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm run dev
```

The UI starts at **http://localhost:5173**

`frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

---

## 📂 Project Structure

```
HireNest/
├── backend/
│   ├── core/
│   │   ├── database.py     # SQLAlchemy engine (reads DATABASE_URL from .env)
│   │   └── security.py     # JWT creation & verification (reads SECRET_KEY from .env)
│   ├── routers/            # API routes: auth, jobs, applications, profile, messages
│   ├── uploads/
│   │   ├── resumes/        # PDF resumes — served via authenticated endpoint only
│   │   └── avatars/        # Profile pictures — served via /static/avatars/
│   ├── main.py             # App entry point, middleware, file-serving routes
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic validation schemas
│   ├── crud.py             # Database operations
│   ├── .env                # Your local secrets (git-ignored)
│   └── .env.example        # Template — copy this to .env
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance with auth + auto-logout interceptors
    │   ├── context/        # Auth state (Context API)
    │   ├── pages/          # Dashboards, Login, Register, Home, Profile
    │   └── App.jsx         # Routing & layout
    ├── .env                # Frontend env vars (git-ignored)
    └── .env.example        # Template — copy this to .env
```

---

## 🛡️ Security

| Area | Implementation |
|---|---|
| Secrets | All credentials in `.env` — never hardcoded |
| Passwords | Bcrypt hashing · min 8 chars + 1 number enforced |
| JWT | Signed with `SECRET_KEY` · tokens expire in 30 min |
| File uploads | Type validation (PDF/image) + size limits (10 MB resumes, 5 MB avatars) |
| Resume access | Authenticated endpoint only — not publicly accessible |
| Duplicate applications | DB-level unique constraint per (user, job) pair |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` on all responses |
| CORS | Restricted origins, methods, and headers via env var |
| Auto-logout | Frontend intercepts 401 responses and clears session |

---

## 📡 API Reference

HireNest includes interactive API docs powered by Swagger UI.

1. Run the backend server.
2. Visit **http://localhost:8000/docs**.
3. Test endpoints (Login, Post Job, Apply, Send Message) directly in your browser.

**Health check:** `GET /health` → `{"status": "ok"}`

---

## 🔮 Roadmap

- [ ] **Email Notifications:** SMTP integration for status updates.
- [ ] **Advanced Search:** Filter jobs by salary, location, and type.
- [ ] **Admin Panel:** User management and analytics dashboard.
- [ ] **Cloud Storage:** S3 integration for scalable file hosting.
- [ ] **Database Migrations:** Alembic for version-controlled schema changes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/NewFeature`)
3. **Commit your Changes** (`git commit -m 'Add NewFeature'`)
4. **Push to the Branch** (`git push origin feature/NewFeature`)
5. **Open a Pull Request**

---

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ by @axiswanderer**
