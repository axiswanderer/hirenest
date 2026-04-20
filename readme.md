---

# HireNest | The Future of Hiring

![HireNest Hero](https://github.com/axiswanderer/hirenest/blob/main/screenshots/hero.png)

> **HireNest** is a modern, full-stack recruitment platform that bridges the gap between talent and opportunity. Built with a robust **FastAPI** backend and a high-performance **React** frontend, it features role-based portals, real-time messaging, and secure application tracking.

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge\&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-009688?style=for-the-badge\&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge\&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge\&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge\&logo=postgresql)

</div>

---

## Key Features

### For Recruiters

* **Smart Job Management:** Post, edit, and close job listings instantly.
* **Applicant Dashboard:** View all candidates in a centralized table with status tracking.
* **Rich Profiles:** Access applicant bios, portfolios, and download PDF resumes.
* **Pipeline Control:** Move candidates from *Pending* → *Interviewing* → *Accepted* or *Rejected*.
* **Direct Messaging:** Chat securely with applicants directly from the dashboard.

### For Applicants

* **One-Click Apply:** Upload your resume once and apply to multiple roles effortlessly.
* **Application Tracker:** Real-time status updates on all your submitted applications.
* **Professional Profile:** Build a brand with a custom avatar, bio, and portfolio links.
* **Direct Communication:** Message recruiters to follow up on applications.

---

## Application Demo

|                                    **Recruiter Portal**                                    |                                  **Applicant Profile**                                 |
| :----------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: |
| ![Dashboard](https://github.com/axiswanderer/hirenest/blob/main/screenshots/dashboard.png) | ![Profile](https://github.com/axiswanderer/hirenest/blob/main/screenshots/profile.png) |
|                              *Manage jobs and view candidates*                             |                           *Rich profile with portfolio & bio*                          |

|                                **Real-time Chat**                                |                                **Live Job Board**                                |
| :------------------------------------------------------------------------------: | :------------------------------------------------------------------------------: |
| ![Chat](https://github.com/axiswanderer/hirenest/blob/main/screenshots/chat.png) | ![Hero](https://github.com/axiswanderer/hirenest/blob/main/screenshots/hero.png) |
|                        *Direct messaging between parties*                        |                         *Modern, responsive landing page*                        |

---

## Tech Stack

### Backend (The Engine)

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) - High-performance, async Python framework.
* **Database:** PostgreSQL with [SQLAlchemy ORM](https://www.sqlalchemy.org/).
* **Authentication:** OAuth2 with JWT Tokens (Secure Login/Register).
* **Security:** Passlib (Bcrypt) for password hashing.

### Frontend (The Interface)

* **Framework:** [React](https://react.dev/) (Vite) - Blazing fast SPA architecture.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first professional design.
* **Animations:** [Framer Motion](https://www.framer.com/motion/) - Smooth UI transitions.
* **Icons:** [Lucide React](https://lucide.dev/) - Crisp, modern iconography.
* **Networking:** Axios - Optimized API consumption.

---

## Installation & Setup

Follow these steps to set up HireNest locally.

### Prerequisites

* Python 3.10+
* Node.js 16+
* PostgreSQL (Local or Docker container)

### 1. Clone the Repository

```bash
git clone https://github.com/axiswanderer/hirenest.git
cd hirenest
```

### 2. Backend Setup

Navigate to the backend directory and set up the environment.

```bash
cd backend

# Create Virtual Environment
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

**Database Configuration:**

1. Ensure PostgreSQL is running.
2. Create a database named `jobportal_db`.
3. The app connects via `postgresql://postgres:password@localhost/jobportal_db`. (Update `core/database.py` if your credentials differ).

**Run the Server:**

```bash
uvicorn main:app --reload
```

The API will start at [http://localhost:8000](http://localhost:8000)

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory.

```bash
cd frontend

# Install Dependencies
npm install

# Start the Development Server
npm run dev
```

The UI will start at [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
HireNest/
├── backend/
│   ├── core/           # Database & Security configs
│   ├── routers/        # API Routes (Auth, Jobs, Profile, Chat)
│   ├── uploads/        # Storage for Resumes & Avatars
│   ├── main.py         # App Entry Point
│   ├── models.py       # SQLAlchemy Database Models
│   └── schemas.py      # Pydantic Data Validation
│
├── frontend/
│   ├── src/
│   │   ├── api/        # Axios Configuration
│   │   ├── context/    # Authentication State (Context API)
│   │   ├── pages/      # Dashboards, Login, Home, Profile
│   │   └── App.jsx     # Main Routing & Layout
│   └── tailwind.config # Design System Config
```

---

## API Documentation

HireNest includes interactive API documentation powered by Swagger UI.

1. Run the backend server.
2. Visit [http://localhost:8000/docs](http://localhost:8000/docs).
3. Test endpoints (Login, Post Job, Send Message) directly in your browser.

---

## Roadmap (Future...)

* [ ] Email Notifications: SMTP integration for status updates.
* [ ] Advanced Search: Filter jobs by salary, location, and type.
* [ ] Admin Panel: User management and analytics dashboard.
* [ ] Cloud Storage: S3 integration for scalable file hosting.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/NewFeature`)
3. **Commit your Changes** (`git commit -m 'Add NewFeature'`)
4. **Push to the Branch** (`git push origin feature/NewFeature`)
5. **Open a Pull Request**

---

## License

This project is licensed under the MIT License.

---

**Made with love by @axiswanderer**
