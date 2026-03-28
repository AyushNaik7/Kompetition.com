# Next.js Frontend Setup

## Architecture

**Backend**: Django REST API (Port 8000)
**Frontend**: Next.js + Tailwind CSS (Port 3000)

## Running the Application

### 1. Start Django Backend
```bash
# In project root
python manage.py runserver
```
Backend runs on: http://localhost:8000

### 2. Start Next.js Frontend
```bash
# In frontend folder
cd frontend
npm run dev
```
Frontend runs on: http://localhost:3000

## What's Implemented

### ✅ Backend (Django)
- REST API endpoints
- CORS enabled for Next.js
- Lichess integration
- All business logic

### ✅ Frontend (Next.js)
- Tailwind CSS styling
- Chessboard background pattern
- Home page with stats
- Competitions list page
- API client for Django backend

### 🚧 To Be Built
- Competition detail page
- Match pages
- Leaderboard
- Authentication pages
- Dashboard
- Admin pages

## Tech Stack

- **Frontend**: Next.js 16.2.1 + React 19 + Tailwind CSS 4
- **Backend**: Django 4.2.11 + DRF 3.14.0
- **Database**: SQLite (will upgrade to PostgreSQL)
- **Integration**: Lichess API

## Development

### Frontend Structure
```
frontend/
├── app/
│   ├── page.tsx              # Home page
│   ├── competitions/
│   │   └── page.tsx          # Competitions list
│   ├── layout.tsx            # Root layout with chessboard
│   └── globals.css           # Tailwind imports
├── lib/
│   └── api.ts                # Django API client
└── package.json
```

### API Client Usage
```typescript
import { api } from '@/lib/api';

// Get competitions
const competitions = await api.getCompetitions();

// Get leaderboard
const leaderboard = await api.getLeaderboard(competitionId);

// Sync match result
await api.syncMatchResult(matchId, gameId);
```

## Next Steps

1. Build remaining pages (detail, auth, dashboard)
2. Add state management (React Context or Zustand)
3. Implement authentication flow
4. Add real-time updates (optional)
5. Upgrade to PostgreSQL

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/chess/
- **Django Admin**: http://localhost:8000/admin/
