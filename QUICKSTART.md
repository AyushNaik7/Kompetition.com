# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Setup Database
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Admin User
```bash
python manage.py createsuperuser
# Enter: username, email, password
```

### 4. Start Server
```bash
python manage.py runserver
```

### 5. Access Application
- Web Interface: http://localhost:8000/
- Admin Panel: http://localhost:8000/admin/
- API Root: http://localhost:8000/api/chess/

## Create Your First Competition

### Option 1: Using Web Interface
1. Go to http://localhost:8000/competitions/create/
2. Fill in the form
3. Click Save

### Option 2: Using Admin Panel
1. Go to http://localhost:8000/admin/
2. Click "Chess competitions"
3. Click "Add Chess Competition"
4. Fill in the form and save

### Option 3: Using API
```bash
curl -X POST http://localhost:8000/api/chess/competitions/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sunday Blitz Battle",
    "slug": "sunday-blitz-battle",
    "description": "Weekly blitz tournament",
    "start_time": "2026-05-10T10:00:00Z",
    "end_time": "2026-05-10T18:00:00Z",
    "match_type": "1v1",
    "time_control": "3+2",
    "max_participants": 10,
    "is_active": true
  }'
```

## Register Participants

### Web Interface
1. Go to competition detail page
2. Click "Register" button
3. Fill in the form

### API
```bash
curl -X POST http://localhost:8000/api/chess/competitions/1/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Alice Smith",
    "email": "alice@example.com",
    "mobile_number": "+1234567890",
    "lichess_username": "alicesmith"
  }'
```

## Create Matches

### Web Interface
1. Go to competition detail page
2. Click "Create Match"
3. Select two players
4. Add Lichess game ID (optional)
5. Click Save

### API
```bash
curl -X POST http://localhost:8000/api/chess/competitions/1/create_match/ \
  -H "Content-Type: application/json" \
  -d '{
    "player1": 1,
    "player2": 2,
    "round_number": 1,
    "lichess_game_id": "dKbV8Oba",
    "status": "pending"
  }'
```

## Sync Results from Lichess

### Using API
```bash
curl -X POST http://localhost:8000/api/chess/matches/1/sync_result/ \
  -H "Content-Type: application/json" \
  -d '{"lichess_game_id": "dKbV8Oba"}'
```

### Sample Game IDs for Testing
- `dKbV8Oba` - White wins
- `q7ZvsdUF` - Black wins  
- `GpYhZPz3` - Draw

## View Leaderboard

### Web Interface
1. Go to competition detail page
2. Click "Leaderboard" button

### API
```bash
curl http://localhost:8000/api/chess/competitions/1/leaderboard/
```

## Complete Workflow Example

```bash
# 1. Create competition
curl -X POST http://localhost:8000/api/chess/competitions/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Tournament","slug":"test-tournament","description":"Test","start_time":"2026-05-10T10:00:00Z","end_time":"2026-05-10T18:00:00Z","match_type":"1v1","time_control":"3+2","max_participants":10,"is_active":true}'

# 2. Register participants
curl -X POST http://localhost:8000/api/chess/competitions/1/register/ \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Alice","email":"alice@test.com","mobile_number":"+1111111111","lichess_username":"alice"}'

curl -X POST http://localhost:8000/api/chess/competitions/1/register/ \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Bob","email":"bob@test.com","mobile_number":"+2222222222","lichess_username":"bob"}'

# 3. Create match
curl -X POST http://localhost:8000/api/chess/competitions/1/create_match/ \
  -H "Content-Type: application/json" \
  -d '{"player1":1,"player2":2,"round_number":1,"lichess_game_id":"dKbV8Oba","status":"pending"}'

# 4. Sync result
curl -X POST http://localhost:8000/api/chess/matches/1/sync_result/ \
  -H "Content-Type: application/json" \
  -d '{"lichess_game_id":"dKbV8Oba"}'

# 5. View leaderboard
curl http://localhost:8000/api/chess/competitions/1/leaderboard/
```

## Troubleshooting

### Port Already in Use
```bash
python manage.py runserver 8001
```

### Database Locked
```bash
rm db.sqlite3
python manage.py migrate
```

### Module Not Found
```bash
pip install -r requirements.txt
```

### Lichess API Not Working
- Check internet connection
- Verify game ID is correct
- Ensure game is completed on Lichess
- Try with sample game IDs provided above
