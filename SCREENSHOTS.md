# Screenshots Guide

## Expected Pages and Features

### 1. Competition List Page
**URL:** `/competitions/`

Features:
- Table showing all competitions
- Columns: Title, Time Control, Start/End Time, Participants, Status, Actions
- "Create New Competition" button
- Active/Inactive badges
- View and Register buttons for each competition

### 2. Competition Detail Page
**URL:** `/competitions/{slug}/`

Features:
- Competition information card (description, time control, dates, status)
- Action buttons: Edit, Register, Create Match, Leaderboard
- Participants table with Lichess usernames (linked)
- Matches table with results and status badges
- Participant and match counts

### 3. Competition Create/Edit Form
**URL:** `/competitions/create/` or `/competitions/{slug}/edit/`

Features:
- Form fields for all competition attributes
- DateTime pickers for start/end times
- Slug auto-generation from title
- Validation messages
- Save and Cancel buttons

### 4. Participant Registration Form
**URL:** `/competitions/{slug}/register/`

Features:
- Competition info card at top
- Registration form with fields:
  - Full Name
  - Email
  - Mobile Number
  - Lichess Username
- Validation for duplicate registration
- Time window validation
- Success message after registration

### 5. Match Creation Form
**URL:** `/competitions/{slug}/matches/create/`

Features:
- Dropdown for Player 1 (registered participants only)
- Dropdown for Player 2 (registered participants only)
- Round number input
- Lichess game ID/URL input
- Status dropdown
- Instructions card explaining the process
- Validation preventing self-pairing

### 6. Match Detail Page
**URL:** `/matches/{id}/`

Features:
- Match information card showing:
  - Players (linked to Lichess profiles)
  - Competition (linked)
  - Round number
  - Status badge
  - Result
  - Winner (if completed)
  - Result source (API/Manual)
  - Lichess game link
  - Start/finish timestamps
- API sync instructions
- Back to competition button

### 7. Leaderboard Page
**URL:** `/competitions/{slug}/leaderboard/`

Features:
- Table with columns:
  - Rank
  - Participant Name
  - Lichess Username (linked)
  - Matches Played
  - Wins
  - Draws
  - Losses
  - Points (bold)
- Sorted by points, then wins, then registration time
- Scoring system explanation card
- Tie-break rules explanation
- Back to competition button

### 8. Admin Panel
**URL:** `/admin/`

Features:
- Django admin interface
- Models: Competitions, Participants, Matches, Sync Logs
- List views with filters and search
- Inline editing capabilities
- Bulk actions
- Result sync logs for debugging

## API Response Examples

### Active Competitions
```json
GET /api/chess/competitions/active/

[
  {
    "id": 1,
    "title": "Sunday Blitz Battle",
    "slug": "sunday-blitz-battle",
    "participant_count": 4,
    "is_registration_open": true,
    ...
  }
]
```

### Leaderboard
```json
GET /api/chess/competitions/1/leaderboard/

[
  {
    "rank": 1,
    "participant_name": "Alice Smith",
    "lichess_username": "alicesmith",
    "matches_played": 3,
    "wins": 2,
    "draws": 1,
    "losses": 0,
    "points": 2.5
  }
]
```

### Result Sync Success
```json
POST /api/chess/matches/1/sync_result/

{
  "message": "Result synced successfully",
  "result": "1-0",
  "winner": "Alice Smith"
}
```

## UI Elements

### Status Badges
- **Active** (green): Competition is currently running
- **Inactive** (gray): Competition is not active
- **Completed** (green): Match is finished
- **Active** (yellow): Match is in progress
- **Pending** (gray): Match not started

### Buttons
- **Primary (blue)**: Main actions (Create, Edit, Save)
- **Success (green)**: Register, positive actions
- **Secondary (gray)**: View, Cancel, Back
- **Warning (yellow)**: Leaderboard, caution actions
- **Danger (red)**: Delete, destructive actions

### Tables
- Striped rows for readability
- Hover effects
- Sortable columns (in admin)
- Responsive design
- Action buttons in last column

### Forms
- Clear labels
- Placeholder text
- Validation error messages in red
- Required field indicators
- Help text where needed

## Testing Checklist

- [ ] Create competition via web form
- [ ] Register 4+ participants
- [ ] Create matches between participants
- [ ] Sync results from Lichess
- [ ] View updated leaderboard
- [ ] Test duplicate registration (should fail)
- [ ] Test self-pairing (should fail)
- [ ] Test duplicate game ID (should fail)
- [ ] Test completed match re-sync (should fail)
- [ ] Test time window validation
- [ ] View all pages without errors
- [ ] Test API endpoints with curl/Postman
- [ ] Check admin panel functionality
- [ ] Verify Lichess links work
- [ ] Confirm points calculation is correct
