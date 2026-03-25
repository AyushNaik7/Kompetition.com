# API Documentation

Base URL: `http://localhost:8000/api/chess`

## Competitions

### List All Competitions
```
GET /competitions/
```

Response:
```json
[
  {
    "id": 1,
    "title": "Sunday Blitz Battle",
    "slug": "sunday-blitz-battle",
    "description": "Weekly blitz tournament",
    "start_time": "2026-05-10T10:00:00Z",
    "end_time": "2026-05-10T18:00:00Z",
    "match_type": "1v1",
    "time_control": "3+2",
    "max_participants": 10,
    "is_active": true,
    "participant_count": 4,
    "is_registration_open": true
  }
]
```

### Get Active Competitions
```
GET /competitions/active/
```

Returns only competitions that are currently active and within the time window.

### Get Competition Details
```
GET /competitions/{id}/
```

### Create Competition
```
POST /competitions/
Content-Type: application/json

{
  "title": "Sunday Blitz Battle",
  "slug": "sunday-blitz-battle",
  "description": "Weekly blitz tournament",
  "start_time": "2026-05-10T10:00:00Z",
  "end_time": "2026-05-10T18:00:00Z",
  "match_type": "1v1",
  "time_control": "3+2",
  "max_participants": 10,
  "is_active": true
}
```

### Register Participant
```
POST /competitions/{id}/register/
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "mobile_number": "+1234567890",
  "lichess_username": "johndoe"
}
```

Validations:
- Competition must be active and within time window
- Email must be unique per competition
- Lichess username is required
- Max participants limit enforced

### Get Participants
```
GET /competitions/{id}/participants/
```

### Get Matches
```
GET /competitions/{id}/matches/
```

### Create Match
```
POST /competitions/{id}/create_match/
Content-Type: application/json

{
  "player1": 1,
  "player2": 2,
  "round_number": 1,
  "lichess_game_id": "dKbV8Oba",
  "lichess_game_url": "https://lichess.org/dKbV8Oba",
  "status": "pending"
}
```

Validations:
- Player 1 and Player 2 must be different
- Both players must be registered in the competition
- Lichess game ID must be unique per competition

### Get Leaderboard
```
GET /competitions/{id}/leaderboard/
```

Response:
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

Ranking Logic:
1. Higher points (Win=1, Draw=0.5, Loss=0)
2. More wins
3. Earlier registration time

## Matches

### List All Matches
```
GET /matches/
```

### Get Match Details
```
GET /matches/{id}/
```

### Sync Result from Lichess
```
POST /matches/{id}/sync_result/
Content-Type: application/json

{
  "lichess_game_id": "dKbV8Oba"
}
```

This endpoint:
1. Fetches game data from Lichess API
2. Extracts the result (1-0, 0-1, 1/2-1/2, or *)
3. Updates match status to 'completed'
4. Sets the winner
5. Logs the sync attempt

Response (Success):
```json
{
  "message": "Result synced successfully",
  "result": "1-0",
  "winner": "John Doe"
}
```

Response (Error):
```json
{
  "error": "Match is already completed. Admin override required."
}
```

Validations:
- Match must not be already completed
- Valid Lichess game ID required
- Game must exist on Lichess
- Duplicate game IDs prevented

## Error Responses

### 400 Bad Request
```json
{
  "error": "Detailed error message"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Implement rate limiting on registration endpoints
- Cache leaderboard calculations
- Add throttling for result sync endpoints

## Authentication

Currently all endpoints are open (AllowAny permission).

For production, consider:
- Admin-only endpoints for competition/match creation
- User authentication for registration
- API key authentication for external integrations
