# Swiss Pairing System - Complete Guide

## Overview

Your Kompetitions platform now includes **automatic Swiss pairing** for tournaments! This means you can run professional Swiss-system tournaments with just one click per round.

## What is Swiss Pairing?

Swiss pairing is a tournament format where:
- Players are paired based on their current score
- Players with similar scores play against each other
- Players never face the same opponent twice
- No elimination - everyone plays all rounds
- Perfect for chess tournaments!

## How It Works

### Round 1
- All players start with 0 points
- Pairings are random (or by rating if available)
- Everyone plays

### Round 2+
- Players are sorted by score
- Top scorers play each other
- Middle scorers play each other
- Bottom scorers play each other
- System avoids repeat pairings

### Odd Number of Players
- Lowest-ranked player who hasn't had a bye gets a bye
- Bye = automatic 1 point (win)
- System tracks who has had byes

## Using the System

### 1. Create a Swiss Tournament

When creating a competition, set:
```
Tournament Type: Swiss System
Max Participants: 16 (or any number)
```

### 2. Players Register

Players register with their Lichess usernames as usual.

### 3. Generate Round 1

Go to: `/admin/competitions/[id]/matches`

Click: **"🎲 Generate Swiss Pairings"**

The system will:
- Create all Round 1 pairings automatically
- Handle odd number of players (bye)
- Create match records in database

### 4. Players Play Games

- Players go to Lichess and play their games
- Admin adds Lichess game IDs to matches
- Background sync script updates results automatically

### 5. Generate Round 2

After all Round 1 games are complete:

Click: **"🎲 Generate Swiss Pairings"** again

The system will:
- Check current standings
- Pair players with similar scores
- Avoid repeat pairings
- Create all Round 2 matches

### 6. Repeat for All Rounds

Continue until tournament is complete!

## Features

### ✅ Automatic Pairing
- One click to generate all matches for a round
- No manual pairing needed

### ✅ Score-Based Matching
- Players with same score play each other
- Fair and competitive pairings

### ✅ Repeat Prevention
- System tracks who has played whom
- Never pairs same players twice

### ✅ Bye Handling
- Automatic bye for odd number of players
- Tracks who has had byes
- Gives bye to lowest-ranked player first

### ✅ Validation
- Won't generate next round if current round incomplete
- Shows error if matches are still pending

## API Endpoint

```
POST /api/chess/competitions/{id}/generate_swiss_pairings/
```

**Response:**
```json
{
  "message": "Successfully created 8 matches for Round 2",
  "round_number": 2,
  "matches_created": 8,
  "bye_player": null,
  "matches": [...]
}
```

**Error Cases:**
- Incomplete matches in previous rounds
- No participants
- System error

## Example Tournament Flow

### 16-Player Swiss Tournament (4 Rounds)

**Round 1:**
- Click "Generate Swiss Pairings"
- 8 matches created
- All players paired randomly

**After Round 1:**
```
Standings:
1. Alice - 1.0 points
2. Bob - 1.0 points
3. Charlie - 1.0 points
4. Diana - 1.0 points
5. Eve - 0.5 points (draw)
6. Frank - 0.5 points (draw)
7. Grace - 0.0 points
8. Henry - 0.0 points
...
```

**Round 2:**
- Click "Generate Swiss Pairings"
- System pairs:
  - Alice vs Bob (both 1.0)
  - Charlie vs Diana (both 1.0)
  - Eve vs Frank (both 0.5)
  - Grace vs Henry (both 0.0)
  - etc.

**Round 3:**
- Winners play winners
- Losers play losers
- Tournament narrows down

**Round 4:**
- Final round
- Top players battle for 1st place
- Final standings determined

## Algorithm Details

The Swiss pairing algorithm:

1. **Get Current Standings**
   - Calculate points for each player
   - Sort by score (descending)

2. **Group by Score**
   - Group players with same score
   - Process from highest to lowest

3. **Pair Within Groups**
   - Take first player in group
   - Find opponent they haven't played
   - Create pairing

4. **Handle Unpaired Players**
   - If odd number in group, pair with next lower group
   - Ensure no repeat pairings

5. **Assign Bye**
   - If odd total players, give bye to lowest-ranked
   - Prefer players who haven't had bye yet

## Files

### Backend
- `chess_app/swiss_pairing.py` - Swiss pairing algorithm
- `chess_app/api_views.py` - API endpoint for generating pairings

### Frontend
- `frontend/app/admin/competitions/[id]/matches/page.tsx` - Admin match list with Swiss button
- `frontend/lib/api.ts` - API client method

## Benefits

### For Tournament Organizers
- ⚡ Fast - generate all pairings in seconds
- 🎯 Accurate - follows Swiss system rules
- 🔄 Automatic - no manual work needed
- 📊 Fair - score-based matching

### For Players
- 🏆 Competitive - play against similar skill level
- 🎮 More games - no elimination
- ⚖️ Fair - everyone plays same number of rounds
- 🎲 Variety - different opponents each round

## Tips

1. **Wait for Round to Complete**
   - Don't generate next round until all games are done
   - System will show error if matches incomplete

2. **Use Background Sync**
   - Run `python sync_ongoing_matches.py`
   - Automatic result syncing
   - Faster tournament flow

3. **Check Standings**
   - Review leaderboard before generating next round
   - Verify results are correct

4. **Odd Number of Players**
   - System handles byes automatically
   - Bye player gets 1 point
   - Rotates byes fairly

## Future Enhancements

Possible improvements:
- Rating-based pairing for Round 1
- Color balance (alternate white/black)
- Tiebreak calculations (Buchholz, Sonneborn-Berger)
- Automatic round advancement
- Live standings during round

---

Your Swiss pairing system is ready to use! Just click the button and let the system handle the rest. 🎉
