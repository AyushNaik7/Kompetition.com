# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Web Browser          │  API Client (curl/Postman/etc)      │
│  - HTML/CSS/JS        │  - REST API calls                    │
│  - Django Templates   │  - JSON requests/responses           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Django Web Framework                                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Web Views      │  │   API Views      │                │
│  │  - competition   │  │  - ViewSets      │                │
│  │  - participant   │  │  - Serializers   │                │
│  │  - match         │  │  - Custom Actions│                │
│  │  - leaderboard   │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      ▼                                       │
│  ┌─────────────────────────────────────────┐                │
│  │         Business Logic Layer            │                │
│  │  - Forms (validation)                   │                │
│  │  - Models (data + validation)           │                │
│  │  - Leaderboard calculation              │                │
│  │  - Result processing                    │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database (Development)                               │
│  PostgreSQL (Production)                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables:                                              │  │
│  │  - chess_competition                                  │  │
│  │  - chess_participant                                  │  │
│  │  - chess_match                                        │  │
│  │  - chess_result_sync_log                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Integration                        │
├─────────────────────────────────────────────────────────────┤
│  Lichess API                                                 │
│  - GET /game/export/{gameId}                                │
│  - Returns game result (winner, status)                     │
│  - Public API, no authentication required                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Competition Creation Flow
```
Admin → Web Form → Django View → Form Validation → Model Save → Database
                                                                    │
                                                                    ▼
                                                          Redirect to Detail
```

### 2. Participant Registration Flow
```
User → Registration Form → View → Form Validation
                                        │
                                        ├─ Check duplicate email
                                        ├─ Check time window
                                        ├─ Check max participants
                                        │
                                        ▼
                                   Model Save → Database
                                        │
                                        ▼
                                Success Message
```

### 3. Match Creation Flow
```
Admin → Match Form → View → Form Validation
                                  │
                                  ├─ Check player1 ≠ player2
                                  ├─ Check both registered
                                  ├─ Check duplicate game ID
                                  │
                                  ▼
                            Model Save → Database
```

### 4. Result Sync Flow
```
API Call → Match ViewSet → sync_result()
              │
              ├─ Check match not completed
              ├─ Extract game ID
              │
              ▼
        Lichess API Request
              │
              ├─ Parse JSON response
              ├─ Map result (1-0, 0-1, 1/2-1/2)
              ├─ Determine winner
              │
              ▼
        Update Match → Database
              │
              ├─ Set result
              ├─ Set winner
              ├─ Set status = completed
              ├─ Set finished_at
              │
              ▼
        Create Sync Log → Database
              │
              ▼
        Return Response
```

### 5. Leaderboard Calculation Flow
```
Request → View/API → Calculate Leaderboard
                          │
                          ├─ Get all participants
                          ├─ For each participant:
                          │   ├─ Count matches as player1
                          │   ├─ Count matches as player2
                          │   ├─ Calculate wins/draws/losses
                          │   └─ Calculate points
                          │
                          ├─ Sort by:
                          │   1. Points (desc)
                          │   2. Wins (desc)
                          │   3. Registration time (asc)
                          │
                          └─ Assign ranks
                          │
                          ▼
                    Return Leaderboard
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Django Project                          │
│                   (chess_competition)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Chess App (chess_app)                  │    │
│  │                                                      │    │
│  │  Models:                                            │    │
│  │  ├─ ChessCompetition                               │    │
│  │  ├─ ChessParticipant                               │    │
│  │  ├─ ChessMatch                                     │    │
│  │  └─ ChessResultSyncLog                             │    │
│  │                                                      │    │
│  │  Views:                                             │    │
│  │  ├─ competition_list/detail/create/edit            │    │
│  │  ├─ participant_register                           │    │
│  │  ├─ match_create/detail                            │    │
│  │  └─ leaderboard                                    │    │
│  │                                                      │    │
│  │  API Views:                                         │    │
│  │  ├─ ChessCompetitionViewSet                        │    │
│  │  │   ├─ active()                                   │    │
│  │  │   ├─ register()                                 │    │
│  │  │   ├─ participants()                             │    │
│  │  │   ├─ matches()                                  │    │
│  │  │   ├─ create_match()                             │    │
│  │  │   └─ leaderboard()                              │    │
│  │  │                                                  │    │
│  │  └─ ChessMatchViewSet                              │    │
│  │      └─ sync_result()                              │    │
│  │                                                      │    │
│  │  Forms:                                             │    │
│  │  ├─ ChessCompetitionForm                           │    │
│  │  ├─ ChessParticipantForm                           │    │
│  │  └─ ChessMatchForm                                 │    │
│  │                                                      │    │
│  │  Serializers:                                       │    │
│  │  ├─ ChessCompetitionSerializer                     │    │
│  │  ├─ ChessParticipantSerializer                     │    │
│  │  ├─ ChessMatchSerializer                           │    │
│  │  └─ LeaderboardSerializer                          │    │
│  │                                                      │    │
│  │  Templates:                                         │    │
│  │  ├─ base.html                                      │    │
│  │  ├─ competition_list.html                          │    │
│  │  ├─ competition_detail.html                        │    │
│  │  ├─ competition_form.html                          │    │
│  │  ├─ participant_register.html                      │    │
│  │  ├─ match_form.html                                │    │
│  │  ├─ match_detail.html                              │    │
│  │  └─ leaderboard.html                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    ChessCompetition                          │
├─────────────────────────────────────────────────────────────┤
│ PK  id                                                       │
│     title                                                    │
│ UK  slug                                                     │
│     description                                              │
│     start_time                                               │
│     end_time                                                 │
│     match_type                                               │
│     time_control                                             │
│     max_participants                                         │
│     is_active                                                │
│     created_at                                               │
│     updated_at                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ChessParticipant                           │
├─────────────────────────────────────────────────────────────┤
│ PK  id                                                       │
│ FK  competition_id                                           │
│     full_name                                                │
│     email                                                    │
│     mobile_number                                            │
│     lichess_username                                         │
│     registered_at                                            │
│ UK  (competition_id, email)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ N:N (via matches)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ChessMatch                              │
├─────────────────────────────────────────────────────────────┤
│ PK  id                                                       │
│ FK  competition_id                                           │
│ FK  player1_id                                               │
│ FK  player2_id                                               │
│     round_number                                             │
│     lichess_game_id                                          │
│     lichess_game_url                                         │
│     status (pending/active/completed/cancelled)              │
│     result (1-0/0-1/1/2-1/2/*)                              │
│ FK  winner_id (nullable)                                     │
│     result_source                                            │
│     started_at                                               │
│     finished_at                                              │
│     created_at                                               │
│     updated_at                                               │
│ UK  (competition_id, lichess_game_id)                        │
│ CK  player1_id ≠ player2_id                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 ChessResultSyncLog                           │
├─────────────────────────────────────────────────────────────┤
│ PK  id                                                       │
│ FK  match_id                                                 │
│     sync_time                                                │
│     source (api/manual/pgn)                                  │
│     success                                                  │
│     error_message                                            │
│     result_data                                              │
└─────────────────────────────────────────────────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
UK = Unique Constraint
CK = Check Constraint
```

## URL Structure

### Web URLs
```
/                                    → Competition list
/competitions/                       → Competition list
/competitions/create/                → Create competition
/competitions/{slug}/                → Competition detail
/competitions/{slug}/edit/           → Edit competition
/competitions/{slug}/register/       → Register participant
/competitions/{slug}/matches/create/ → Create match
/competitions/{slug}/leaderboard/    → Leaderboard
/matches/{id}/                       → Match detail
/admin/                              → Django admin
```

### API URLs
```
GET    /api/chess/competitions/              → List competitions
POST   /api/chess/competitions/              → Create competition
GET    /api/chess/competitions/active/       → Active competitions
GET    /api/chess/competitions/{id}/         → Competition detail
POST   /api/chess/competitions/{id}/register/     → Register
GET    /api/chess/competitions/{id}/participants/ → Participants
GET    /api/chess/competitions/{id}/matches/      → Matches
POST   /api/chess/competitions/{id}/create_match/ → Create match
GET    /api/chess/competitions/{id}/leaderboard/  → Leaderboard
GET    /api/chess/matches/                   → List matches
GET    /api/chess/matches/{id}/              → Match detail
POST   /api/chess/matches/{id}/sync_result/  → Sync result
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Input Validation                                        │
│     ├─ Form validation (Django forms)                       │
│     ├─ Serializer validation (DRF)                          │
│     └─ Model validation (clean methods)                     │
│                                                              │
│  2. Database Constraints                                    │
│     ├─ Unique constraints                                   │
│     ├─ Foreign key constraints                              │
│     └─ Check constraints                                    │
│                                                              │
│  3. Business Logic Validation                               │
│     ├─ Time window checks                                   │
│     ├─ Duplicate prevention                                 │
│     ├─ Self-pairing prevention                              │
│     └─ Result locking                                       │
│                                                              │
│  4. Django Security Features                                │
│     ├─ CSRF protection                                      │
│     ├─ SQL injection prevention (ORM)                       │
│     ├─ XSS protection (template escaping)                   │
│     └─ Clickjacking protection                              │
│                                                              │
│  5. Audit Trail                                             │
│     ├─ Result sync logging                                  │
│     ├─ Timestamp tracking                                   │
│     └─ Source tracking                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                         (Nginx)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Servers                        │
│                  (Gunicorn + Django)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Instance 1 │  │   Instance 2 │  │   Instance N │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│   PostgreSQL     │  │    Redis     │  │   Celery     │
│   (Database)     │  │   (Cache)    │  │  (Tasks)     │
└──────────────────┘  └──────────────┘  └──────────────┘
```

---

**Note:** This architecture is designed for scalability and can be extended with additional components like message queues, CDN, and monitoring services as needed.
