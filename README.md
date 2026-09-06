# SamadhanX - Societal Innovation Collaboration Portal
**SIH 26043**

SamadhanX is a comprehensive civic innovation platform connecting citizens, government bodies, higher education institutions (HEIs), and industry partners to collaborate on and solve localized societal challenges.

## Architecture

This project is built using:
- **Backend:** Django 5, Django REST Framework, SQLite (dev) / PostgreSQL (prod).
- **Frontend:** React, Vite, React Router, Recharts, Zustand.
- **Styling:** Custom CSS implementing a professional, institutional design system.

## Prerequisites
- Python 3.10+
- Node.js 18+

---

## 1. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```bash
   python manage.py migrate
   ```
5. Seed the database with demo users, universities, and challenges:
   ```bash
   python manage.py seed_demo
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```
   The backend API will run at `http://localhost:8000`.

---

## 2. Frontend Setup (React/Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173`. The Vite proxy is pre-configured to forward API requests to port 8000.

---

## Demo Users

All demo users share the same password: **`Demo@1234`**

| Role | Username | Description |
| :--- | :--- | :--- |
| **Citizen** | `citizen1` | Submit societal problems and track status. |
| **Gov Admin** | `admin` | View analytics, manage challenges, and route them to HEIs. |
| **HEI SPOC** | `hei_spoc1` | Receive assigned challenges and form project teams. |
| **Faculty Mentor**| `faculty1` | Mentor student teams, create and review project milestones. |
| **Industry** | `industry1` | Browse active projects and offer funding or mentorship support. |

## Application Structure & Workflows

- **Citizen App:** Mobile-first interface for submitting localized issues with photo evidence, categorization, and tracking.
- **Admin Dashboard:** Centralized view for government officials with analytical charts to route problems based on district and category.
- **University Hub:** Project management for HEIs to assign faculty and student teams to solve routed problems.
- **Industry Portal:** Browsing platform for private sector partners to view in-progress societal projects and pledge funding or pilot infrastructure.
