# Testing Guide

## Manual Testing Steps

### 1. Setup
```bash
# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh
./setup.sh
```

### 2. Start Server
```bash
python manage.py runserver
```

### 3. Access Admin Panel
1. Go to http://localhost:8000/admin/
2. Login with superuser credentials
3. Create a test competition

### 4. Test Competition Creation
1. Go to http://localhost:8000/competitions/create/
2. Fill in the form:
   - Title: Sunday Blitz Battle
   - Slug: sunday-blitz-battle
   - Description: Weekly blitz tournament
   - Start Time: (current date/time)
   - End Time: (future date/time)
   - Match Type: 1v1
   - Time Control: 3+2
   - Max Participants: 10
   - Is Active: Yes
3. Click Save

### 5. Test Participant Registration
1. Go to http://localhost:8000/competitions/sunday-blitz-battle/register/
2. Register 4 participants with different emails
3. Try registering the same email twice (should fail)
4. Verify participants appear in competition detail page

### 6. Test Match Creation
1. Go to http://localhost:8000/competitions/sunday-blitz-battle/matches/create/
2. Create a match between two participants
3. Add a Lichess game ID (use real completed games for testing)
4. Try creating a match with same player twice (should fail)

### 7. Test Result Synchronization

#### Using API (Recommended)
```bash
# Using curl
curl -X POST http://localhost:8000/api/chess/matches/1/sync_result/ \
  -H "Content-Type: application/json" \
  -d '{"lichess_game_id": "dKbV8Oba"}'

# Using Python
python test_api.py
```

#### Sample Lichess Game IDs for Testing
- `dKbV8Oba` - White wins (1-0)
- `q7ZvsdUF` - Black wins (0-1)
- `GpYhZPz3` - Draw (1/2-1/2)

### 8. Test Leaderboard
1. Create multiple matches with different results
2. Sync results for all matches
3. Go to http://localhost:8000/competitions/sunday-blitz-battle/leaderboard/
4. Verify points calculation:
   - Win = 1 point
   - Draw = 0.5 points
   - Loss = 0 points
5. Verify ranking order (points > wins > registration time)

### 9. Test Anti-Abuse Controls

#### Duplicate Registration
1. Try registering same email twice
2. Should show error: "You have already registered for this competition"

#### Self-Pairing
1. Try creating match with same player as both player1 and player2
2. Should show error: "Player 1 and Player 2 cannot be the same"

#### Duplicate Game ID
1. Create match with game ID "abc123"
2. Try creating another match with same game ID
3. Should show error: "This Lichess game ID is already used"

#### Match Result Locking
1. Sync result for a match (status becomes 'completed')
2. Try syncing again
3. Should show error: "Match is already completed"

#### Time Window Validation
1. Set competition end time to past
2. Try registering
3. Should show error: "Registration is closed"

## API Testing

### Get Active Competitions
```bash
curl http://localhost:8000/api/chess/competitions/active/
```

### Register Participant
```bash
curl -X POST http://localhost:8000/api/chess/competitions/1/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "mobile_number": "+1234567890",
    "lichess_username": "johndoe"
  }'
```

### Create Match
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

### Sync Result
```bash
curl -X POST http://localhost:8000/api/chess/matches/1/sync_result/ \
  -H "Content-Type: application/json" \
  -d '{"lichess_game_id": "dKbV8Oba"}'
```

### Get Leaderboard
```bash
curl http://localhost:8000/api/chess/competitions/1/leaderboard/
```

## Expected Results

### Successful Registration
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "mobile_number": "+1234567890",
  "lichess_username": "johndoe",
  "competition": 1,
  "registered_at": "2026-05-10T10:00:00Z"
}
```

### Successful Result Sync
```json
{
  "message": "Result synced successfully",
  "result": "1-0",
  "winner": "John Doe"
}
```

### Leaderboard Response
```json
[
  {
    "rank": 1,
    "participant_id": 1,
    "participant_name": "John Doe",
    "lichess_username": "johndoe",
    "matches_played": 3,
    "wins": 2,
    "draws": 1,
    "losses": 0,
    "points": 2.5
  }
]
```

## Troubleshooting

### Lichess API Issues
- Ensure game ID is valid and game is completed
- Check internet connection
- Lichess API may have rate limits (generous for testing)

### Database Issues
- Delete db.sqlite3 and run migrations again
- Check for migration conflicts

### Import Errors
- Ensure all dependencies are installed
- Activate virtual environment
