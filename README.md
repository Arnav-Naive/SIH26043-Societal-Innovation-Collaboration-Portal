# SamadhanX - Societal Innovation Collaboration Portal (SIH 26043)

A centralized platform bridging the gap between local societal problems and academic/industry innovation, designed for the Smart India Hackathon.

## Local Setup

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory (for python-decouple):
   ```env
   SECRET_KEY=dev-secret-key
   DEBUG=True
   ALLOWED_HOSTS=*
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   # DATABASE_URL is optional for local dev, defaults to SQLite
   ```
5. Run migrations and seed demo data:
   ```bash
   python manage.py migrate
   ```
6. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

### Backend (e.g., Railway, Render)
Deploy the `backend` directory as a Python/Django app. Set the following environment variables in your hosting dashboard:
- `SECRET_KEY`: A strong secret key.
- `DEBUG`: `False`
- `ALLOWED_HOSTS`: The domain of your backend (e.g., `api.samadhanx.com`)
- `CORS_ALLOWED_ORIGINS`: The domain of your frontend (e.g., `https://samadhanx.com`)
- `DATABASE_URL`: PostgreSQL connection string provided by your host.

### Frontend (Cloudflare Pages)
Deploy the `frontend` directory to Cloudflare Pages.
- **Build command:** `npm run build`
- **Build directory:** `dist`

Set the following environment variable in Cloudflare Pages:
- `VITE_API_BASE_URL`: The public URL of your backend (e.g., `https://api.samadhanx.com/api`)

## Demo Credentials

You can use the following credentials to test the different roles:

- **Government Admin:** `admin` / `Demo@1234`
- **Citizen:** `citizen1` / `Demo@1234`
- **HEI SPOC:** `hei_spoc1` / `Demo@1234`
- **Faculty Mentor:** `faculty1` / `Demo@1234`
- **Industry Partner:** `industry1` / `Demo@1234`