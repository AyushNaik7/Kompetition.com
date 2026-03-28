# Quick Start: Running Your First Tournament

## 🚀 5-Minute Setup

### 1. Start Everything (3 terminals)

**Terminal 1 - Backend:**
```bash
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Auto Sync:**
```bash
python sync_ongoing_matches.py
```

### 2. Create Tournament

1. Go to http://localhost:3000
2. Login (username: `admin`, password: your admin password)
3. Click "Create Competition"
4. Fill in:
   - Title: "Friday Night Blitz"
   - Tournament Type: **Swiss System**
   - Time Control: 3+2
   - Max Participants: 16
   - Registration Deadline: (set to tomorrow)
   - Start Time: (set to tonight)
5. Click "Create"

### 3. Players Register

Share the competition link with players:
```
http://localhost:3000/competitions/friday-night-blitz-xxxxx
```

Players click "Register Now" and enter:
- Full Name
- Email
- Mobile Number
- Lichess Username

### 4. Generate Round 1

When ready to start:

1. Go to `/admin/competitions/[id]/matches`
2. Click **"🎲 Generate Swiss Pairings"**
3. ✅ All Round 1 matches created automatically!

### 5. Players Play

Each pair:
1. Goes to Lichess.org
2. One player challenges the other
3. They play the game
4. Game finishes

### 6. Results Sync Automatically

The background script (`sync_ongoing_matches.py`) will:
- Check every 30 seconds
- Detect finished games
- Update results automatically
- Update leaderboard

### 7. Generate Round 2

When all Round 1 games are done:

1. Click **"🎲 Generate Swiss Pairings"** again
2. ✅ Round 2 matches created based on standings!

### 8. Repeat Until Complete

Continue for 4-5 rounds, then check final standings!

## 🎯 That's It!

Your tournament is running with:
- ✅ Automatic pairing
- ✅ Automatic result syncing
- ✅ Real-time leaderboard
- ✅ Professional Swiss system

## 📱 Quick Commands

### Check Standings
```bash
python manage.py shell -c "from chess_app.swiss_pairing import get_standings; from chess_app.models import ChessCompetition; comp = ChessCompetition.objects.get(id=YOUR_ID); standings = get_standings(comp); [print(f'{i}. {s[\"participant\"].full_name} - {s[\"score\"]} pts') for i, s in enumerate(standings, 1)]"
```

### Manual Result Sync
Go to match detail page and click "Sync Result"

### View All Matches
Go to `/admin/competitions/[id]/matches`

## 🎮 Player Experience

1. Register for tournament
2. Receive pairing notification
3. Go to Lichess and play
4. Check leaderboard for standings
5. Wait for next round pairing
6. Repeat!

## 🏆 Admin Experience

1. Create tournament
2. Click "Generate Swiss Pairings"
3. Wait for games to finish
4. Click "Generate Swiss Pairings" again
5. Repeat until tournament complete
6. Announce winners!

## 💡 Pro Tips

1. **Start sync script first** - It takes 30 seconds to check, so start it before Round 1
2. **Wait for all games** - Don't generate next round until all games are done
3. **Check leaderboard** - Verify results before next round
4. **Communicate with players** - Let them know when next round starts
5. **Have fun!** - The system handles everything automatically

---

**You're ready to run professional chess tournaments!** 🎉
