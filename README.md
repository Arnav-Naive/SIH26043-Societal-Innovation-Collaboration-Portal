# SamadhanX (SIH 26043)

A societal-problem-to-innovation pipeline connecting citizens, government, higher education institutions (HEIs), and industry partners.

## Architecture
- Django 5 + DRF + SQLite (dev) / PostgreSQL (prod)
- React + Vite + React Router
- WhiteNoise for static files
- sentence-transformers for semantic duplicate detection
- Gemini AI for challenge categorization

## Local Setup

1. `git clone` → `cd backend` → `python -m venv venv` → activate
2. `pip install -r requirements.txt`
3. Create `backend/.env` with exact contents:
   ```
   SECRET_KEY=dev-secret-key-change-this
   DEBUG=True
   ALLOWED_HOSTS=*
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   DATABASE_URL=sqlite:///db.sqlite3
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   ```
4. `python manage.py migrate`
5. `python manage.py seed_demo`
6. `python manage.py runserver`
7. New terminal → `cd frontend` → `npm install`
8. Create `frontend/.env.local` with:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
9. `npm run dev` → visit http://localhost:5173

## Production Deployment

**Railway (Backend):**
- Connect GitHub repo, set root to `/backend`
- Start command: `gunicorn config.wsgi:application`
- Add Postgres plugin (DATABASE_URL auto-set)
- Env vars to set: SECRET_KEY, DEBUG=False, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, DATABASE_URL, AI_PROVIDER, GEMINI_API_KEY
- Run migration: use Railway shell or add to release command

**Cloudflare Pages (Frontend):**
- Connect GitHub repo
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Env var: `VITE_API_BASE_URL=https://<your-railway-domain>/api`
- Auto-deploys on every push to `main`

## Demo Credentials
All roles use the password: `Demo@1234`

| Role | Username |
|---|---|
| Government Admin | `admin` |
| Citizen | `citizen1` |
| HEI SPOC | `hei_spoc1` |
| Faculty Mentor | `faculty1` |
| Industry Partner | `industry1` |