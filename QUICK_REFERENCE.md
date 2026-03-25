# Quick Reference Card

## Essential Commands

### Setup
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Create Demo Data
```bash
python manage.py shell < create_demo_data.py
```

### Test API
```bash
python test_api.py
```

## URLs

### Web Interface
```
http://localhost:8000/                          # Home
http://localhost:8000/competitions/             # Competition list
http://localhost:8000/competitions/create/      # Create competition
http://localhost:8000/admin/                    # Admin panel
```

### API Endpoints
```
GET  /api/chess/competitions/active/            # Active competitions
POST /api/chess/competitions/{id}/register/     # Register
POST /api/chess/competitions/{id}/create_match/ # Create match
POST /api/chess/matches/{id}/sync_result/       # Sync result
GET  /api/chess/competitions/{id}/leaderboard/  # Leaderboard
```

## Sample API Calls

### Get Active Competitions
```bash
curl http://localhost:8000/api/chess/competitions/active/
```

### Register Participant
```bash
curl -X POST http://localhost:8000/api/chess/competitions/1/register/ \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe","email":"john@test.com","mobile_number":"+1234567890","lichess_username":"johndoe"}'
```

### Create Match
```bash
curl -X POST http://localhost:8000/api/chess/competitions/1/create_match/ \
  -H "Content-Type: application/json" \
  -d '{"player1":1,"player2":2,"round_number":1,"lichess_game_id":"dKbV8Oba","status":"pending"}'
```

### Sync Result
```bash
curl -X POST http://localhost:8000/api/chess/matches/1/sync_result/ \
  -H "Content-Type: application/json" \
  -d '{"lichess_game_id":"dKbV8Oba"}'
```

### Get Leaderboard
```bash
curl http://localhost:8000/api/chess/competitions/1/leaderboard/
```

## Sample Lichess Game IDs

For testing result synchronization:
- `dKbV8Oba` - White wins (1-0)
- `q7ZvsdUF` - Black wins (0-1)
- `GpYhZPz3` - Draw (1/2-1/2)

## Models Quick Reference

### ChessCompetition
```python
title, slug, description
start_time, end_time
match_type, time_control
max_participants, is_active
```

### ChessParticipant
```python
competition (FK)
full_name, email
mobile_number, lichess_username
registered_at
```

### ChessMatch
```python
competition (FK)
player1 (FK), player2 (FK)
round_number
lichess_game_id, lichess_game_url
status, result, winner (FK)
result_source
started_at, finished_at
```

## Status Values

### Match Status
- `pending` - Not started
- `active` - In progress
- `completed` - Finished
- `cancelled` - Cancelled

### Match Result
- `1-0` - Player 1 won
- `0-1` - Player 2 won
- `1/2-1/2` - Draw
- `*` - No result

## Points System

- Win: 1.0 point
- Draw: 0.5 points
- Loss: 0.0 points

## Ranking Tie-breaks

1. Total points (higher is better)
2. Number of wins (higher is better)
3. Registration time (earlier is better)

## Anti-Abuse Controls

1. ✓ Duplicate registration prevention
2. ✓ Self-pairing prevention
3. ✓ Duplicate game ID prevention
4. ✓ Match result locking
5. ✓ Time window validation
6. ✓ Result source tracking

## Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Already registered" | Duplicate email | Use different email |
| "Same player" | player1 == player2 | Select different players |
| "Game ID used" | Duplicate game ID | Use different game ID |
| "Already completed" | Match completed | Admin override needed |
| "Registration closed" | Outside time window | Check competition dates |

## File Locations

### Models
`chess_app/models.py`

### Views
- Web: `chess_app/views.py`
- API: `chess_app/api_views.py`

### Forms
`chess_app/forms.py`

### Templates
`chess_app/templates/chess_app/`

### Admin
`chess_app/admin.py`

### Settings
`chess_competition/settings.py`

## Database Commands

### Shell
```bash
python manage.py shell
```

### Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Database Shell
```bash
python manage.py dbshell
```

## Troubleshooting Quick Fixes

### Port in use
```bash
python manage.py runserver 8001
```

### Database locked
```bash
rm db.sqlite3
python manage.py migrate
```

### Module not found
```bash
pip install -r requirements.txt
```

### CSRF error
Add to settings.py:
```python
CSRF_TRUSTED_ORIGINS = ['http://localhost:8000']
```

## Documentation Files

| File | Purpose |
|------|---------|
| README.md | Main documentation |
| QUICKSTART.md | 5-minute setup |
| PROJECT_SUMMARY.md | Feature overview |
| SUBMISSION.md | Submission summary |
| IMPLEMENTATION_NOTES.md | Design decisions |
| ARCHITECTURE.md | System architecture |
| API_DOCUMENTATION.md | API reference |
| TESTING.md | Testing guide |
| TROUBLESHOOTING.md | Common issues |
| SCREENSHOTS.md | UI guide |
| INDEX.md | Documentation index |
| CHANGELOG.md | Version history |
| QUICK_REFERENCE.md | This file |

## Key Features

✓ Competition management
✓ Participant registration
✓ Match creation
✓ Lichess integration
✓ Result synchronization
✓ Leaderboard generation
✓ REST API
✓ Web interface
✓ Admin panel
✓ Anti-abuse controls

## Technology Stack

- Python 3.8+
- Django 4.2
- Django REST Framework 3.14
- SQLite / PostgreSQL
- Lichess API

## License

MIT License

---

**Quick Start:** Run `setup.sh` or `setup.bat` then `python manage.py runserver`

**Demo Data:** `python manage.py shell < create_demo_data.py`

**Test API:** `python test_api.py`

**Access:** http://localhost:8000/
