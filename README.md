# Mini Chess Competition Module - Lichess Integration

## Overview
A Django-based chess competition platform that integrates with Lichess for gameplay and result tracking.

## Features
- Competition management (create, edit, list)
- Participant registration with validation
- Match creation and pairing
- Lichess integration for game results
- Automated leaderboard generation
- Anti-abuse controls

## Technology Stack
- Python 3.8+
- Django 4.2+
- SQLite (default) / PostgreSQL
- Django REST Framework
- Lichess API integration

## Lichess Integration Method

**Selected Approach: Lichess API Based Flow (Option B)**

### Why This Approach?
1. **Automated Result Fetching**: Can automatically pull game results from Lichess API
2. **Real-time Updates**: Can sync results as games complete
3. **Data Integrity**: Direct API access ensures accurate game data
4. **Scalability**: Can handle multiple concurrent matches

### How It Works
1. Admin creates a match and provides Lichess game ID or URL
2. System stores the game ID in the match record
3. Result sync endpoint fetches game data from Lichess API (`https://lichess.org/game/export/{gameId}`)
4. System parses PGN data to extract winner and result
5. Match status and leaderboard are automatically updated

### Limitations
- Requires valid Lichess game ID
- Depends on Lichess API availability
- Rate limits apply (though generous for this use case)
- Games must be completed on Lichess platform
- No real-time game state tracking (only final results)

## Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd chess-competition
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Migrations
```bash
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Load Sample Data (Optional)
```bash
python manage.py loaddata sample_data.json
```

### 7. Run Development Server
```bash
python manage.py runserver
```

Access the application at `http://localhost:8000`

## Project Structure
```
chess-competition/
├── chess_app/                    # Main application
│   ├── models.py                # Data models
│   ├── views.py                 # Web views
│   ├── api_views.py             # REST API endpoints
│   ├── serializers.py           # API serializers
│   ├── forms.py                 # Django forms
│   ├── admin.py                 # Admin interface
│   ├── urls.py                  # Web URLs
│   ├── api_urls.py              # API URLs
│   ├── migrations/              # Database migrations
│   └── templates/               # HTML templates
│       ├── base.html
│       └── chess_app/
├── chess_competition/           # Project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── Documentation/
│   ├── README.md               # This file
│   ├── QUICKSTART.md           # Quick setup guide
│   ├── PROJECT_SUMMARY.md      # Feature overview
│   ├── SUBMISSION.md           # Submission summary
│   ├── IMPLEMENTATION_NOTES.md # Design decisions
│   ├── ARCHITECTURE.md         # System architecture
│   ├── API_DOCUMENTATION.md    # API reference
│   ├── TESTING.md              # Testing guide
│   ├── TROUBLESHOOTING.md      # Common issues
│   ├── SCREENSHOTS.md          # UI guide
│   ├── INDEX.md                # Documentation index
│   └── CHANGELOG.md            # Version history
├── Scripts/
│   ├── setup.sh                # Linux/Mac setup
│   ├── setup.bat               # Windows setup
│   ├── test_api.py             # API testing
│   └── create_demo_data.py     # Demo data
├── manage.py                   # Django management
├── requirements.txt            # Dependencies
├── .gitignore                  # Git ignore
└── LICENSE                     # MIT License
```

## Anti-Abuse Controls Implemented

### 1. Duplicate Registration Prevention
- Database unique constraint on (competition, email)
- Form validation prevents same participant registering twice
- Clear error message shown to user

### 2. Self-Pairing Prevention
- Validation ensures Player 1 ≠ Player 2
- Enforced at model and form level
- Admin cannot create invalid matches

### 3. Duplicate Game ID Prevention
- Unique constraint on Lichess game ID per competition
- Prevents same game from being counted multiple times
- Validation in result sync endpoint

### 4. Match Result Locking
- Completed matches cannot be edited without admin override
- Status transition validation (pending → active → completed)
- Audit trail for manual overrides

### 5. Time Window Validation
- Registration only allowed during competition active period
- Competition must be active (is_active=True)
- Start/end time validation

### 6. Result Source Tracking
- Every result sync logs source (API/Manual/PGN)
- Timestamp tracking for all result updates
- Admin can see result history

## API Endpoints

### Competitions
- `GET /api/chess/competitions/active/` - List active competitions
- `POST /api/chess/competitions/` - Create competition (admin)
- `GET /api/chess/competitions/{id}/` - Competition details

### Registration
- `POST /api/chess/competitions/{id}/register/` - Register participant
- `GET /api/chess/competitions/{id}/participants/` - List participants

### Matches
- `POST /api/chess/competitions/{id}/matches/create/` - Create match (admin)
- `GET /api/chess/competitions/{id}/matches/` - List matches
- `POST /api/chess/matches/{id}/sync-result/` - Sync result from Lichess

### Leaderboard
- `GET /api/chess/competitions/{id}/leaderboard/` - Get leaderboard

## Admin Pages
- `/admin/` - Django admin interface
- `/competitions/` - Competition list
- `/competitions/create/` - Create competition
- `/competitions/{id}/` - Competition detail
- `/competitions/{id}/participants/` - Participant list
- `/competitions/{id}/matches/` - Match list
- `/competitions/{id}/matches/create/` - Create match
- `/competitions/{id}/leaderboard/` - Leaderboard

## Participant Pages
- `/register/{slug}/` - Competition registration
- `/my-matches/` - My matches (requires login)
- `/matches/{id}/` - Match detail
- `/competitions/{id}/standings/` - Standings/leaderboard

## Business Rules Implemented

1. ✅ Participant cannot register twice in same competition
2. ✅ Competition must be active and within time window
3. ✅ Only registered participants can be paired
4. ✅ Match result updates leaderboard correctly
5. ✅ Completed match cannot be edited without admin action
6. ✅ Invalid/missing Lichess data handled safely
7. ✅ Duplicate game mapping prevented

## Leaderboard Logic

### Points System
- Win: 1 point
- Draw: 0.5 points
- Loss: 0 points

### Ranking Tie-breaks (in order)
1. Total points (higher is better)
2. Number of wins (higher is better)
3. Earlier registration time (earlier is better)

## Assumptions Made

1. **Authentication**: Basic Django authentication used; can be extended to OAuth
2. **Lichess Usernames**: Assumed to be valid; no real-time verification
3. **Time Control Format**: Stored as string (e.g., "3+2", "5+0")
4. **Match Type**: Currently only supports 1v1; can extend to team matches
5. **Round Robin**: Manual pairing by admin; automatic pairing is bonus feature
6. **Game Creation**: Games are created on Lichess separately; we only track results
7. **API Rate Limits**: Assumed reasonable usage; no rate limiting implemented
8. **Timezone**: All times in UTC; can be extended for user timezones

## Future Extensions for Tournaments

### Swiss-Style Pairing
- Implement Swiss pairing algorithm
- Automatic opponent matching based on points
- Prevent repeat pairings

### Knockout Brackets
- Single/double elimination support
- Bracket visualization
- Automatic advancement logic

### Automatic Pairing
- Queue-based pairing system
- Real-time match creation
- Player availability tracking

### Enhanced Features
- Email notifications
- Live game embedding
- PGN viewer with board visualization
- Player rating tracking
- Match chat/comments
- Tournament director tools

## Testing

### Manual Testing Steps
1. Create competition as admin
2. Register 4+ participants
3. Create matches between participants
4. Add Lichess game IDs (use real completed games)
5. Sync results via API or admin
6. Verify leaderboard updates correctly
7. Test duplicate registration prevention
8. Test time window validation

### Sample Lichess Game IDs for Testing
- `dKbV8Oba` - White wins
- `q7ZvsdUF` - Black wins
- `GpYhZPz3` - Draw

Use format: `https://lichess.org/{gameId}` or just the game ID

## Known Limitations

1. **No Real-time Game Creation**: Games must be created on Lichess manually
2. **No Live Updates**: Results must be manually synced (can add webhooks)
3. **Basic UI**: Functional but minimal styling
4. **No Player Verification**: Lichess usernames not verified against actual accounts
5. **Manual Pairing**: Admin must create matches manually
6. **Single Competition Type**: Only 1v1 supported currently
7. **No Undo**: Match results cannot be easily reverted once synced

## License Considerations

- Django: BSD License
- Lichess API: Free to use, no authentication required for public games
- No Lichess code directly reused; only API integration
- All custom code is original implementation

## Support & Questions

For issues or questions about implementation decisions, please refer to code comments or contact the developer.

---

**Development Time**: ~6-8 hours
**Focus**: Working flow, correct business logic, clean implementation
