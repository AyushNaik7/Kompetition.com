# Lichess Challenge Popup System

## How It Works Now

When admin clicks "Create Challenge on Lichess", the system:

1. **Creates Official Lichess Challenge**
   - Uses Lichess API
   - Creates challenge FROM tournament organizer account (Ayush0_0)
   - Sends TO the opponent

2. **Opponent Gets Popup on Lichess**
   - If opponent is logged into Lichess
   - They see a challenge notification popup
   - They can accept or decline

3. **Challenge URL Opens**
   - Admin's browser opens the challenge page
   - Shows challenge status
   - Can share link with players

## Usage

### Admin Workflow:

1. Go to match detail page: `/admin/matches/[id]`
2. Click **"Create Challenge on Lichess"** button
3. System creates challenge via API
4. Challenge URL opens in new tab
5. Share URL with players OR they get notification on Lichess

### Player Experience:

**If logged into Lichess:**
- Gets popup notification: "Ayush0_0 challenges you!"
- Click "Accept" to start game
- Game begins immediately

**If not logged in:**
- Admin shares challenge URL
- Player clicks link
- Logs into Lichess
- Accepts challenge
- Game begins

## Important Notes

### API Token Limitation

Your Personal API Token belongs to **Ayush0_0**

This means:
- ✅ Can create challenges FROM Ayush0_0
- ✅ Can challenge any Lichess user
- ❌ Cannot create challenges between two arbitrary players

### Current Setup

Challenges are created FROM: `Ayush0_0` (tournament organizer)
TO: One of the match players

This works well for:
- Official tournament games
- Organizer-hosted matches
- Verified game creation

### Alternative: Player-to-Player

For players to challenge each other directly:
- They use the Lichess friend challenge link
- Or they create game manually on Lichess
- Then paste game ID into your system

## API Endpoint

```
POST /api/chess/matches/{id}/create_lichess_challenge/
```

**Response:**
```json
{
  "message": "Challenge created successfully",
  "challenge_url": "https://lichess.org/challenge/abc123",
  "challenge_id": "abc123"
}
```

## Testing

### 1. Create a Match
```bash
# Admin creates match between two players
```

### 2. Create Challenge
```bash
# Click "Create Challenge on Lichess" button
```

### 3. Check Lichess
- Log into Lichess as the opponent
- Should see challenge notification
- Accept challenge
- Play game!

### 4. Sync Result
- After game finishes
- Click "Sync Result" button
- Or wait for background script

## Troubleshooting

### Challenge Not Appearing

**Check:**
1. Is opponent's Lichess username correct?
2. Is opponent logged into Lichess?
3. Check Django console for API errors
4. Verify API token is valid

**Test API Token:**
```bash
python test_lichess_account.py
```

### Challenge Creation Fails

**Common Issues:**
- Invalid Lichess username
- API token expired
- Rate limiting (too many challenges)
- Opponent has challenges disabled

**Check Console:**
```
Challenge creation failed: 400 - {"error": "..."}
```

## Future Enhancements

### Option 1: Bot Account
- Create Lichess bot account
- Bot can create games between any players
- Requires bot API approval from Lichess

### Option 2: OAuth
- Players authorize your app
- Create challenges on their behalf
- More complex setup

### Option 3: Bulk Challenges
- Create all round challenges at once
- Send to all players simultaneously
- Automated tournament flow

## Files

- `chess_app/lichess_api.py` - Challenge creation functions
- `chess_app/api_views.py` - Challenge API endpoint
- `frontend/app/admin/matches/[id]/page.tsx` - Challenge button UI
- `frontend/lib/api.ts` - API client method

## Benefits

### ✅ Official Challenges
- Real Lichess challenge system
- Popup notifications
- Professional experience

### ✅ Verified Games
- Challenge URL tracked
- Game ID captured automatically
- Easy result syncing

### ✅ Player Convenience
- One-click accept
- No manual game creation
- Instant start

---

**Players now get real Lichess challenge popups!** 🎮🔔
