# Player Notification System

## Overview

When Swiss pairings are generated, players automatically receive notifications about their matches!

## How It Works

### 1. Admin Generates Pairings

Admin clicks "Generate Swiss Pairings" button

### 2. System Sends Notifications

For each match created, the system sends:

**Email to Both Players:**
```
Subject: Match Pairing: Friday Blitz - Round 1

Hello John,

You've been paired for Round 1 of Friday Blitz!

Your opponent: Jane Smith (@janesmith)
Time Control: 3+2

To play your match:
1. Go to Lichess: https://lichess.org/?user=janesmith#friend
2. Challenge janesmith to a game
3. Use time control: 3+2
4. Play your match!

View match details: http://localhost:3000/matches/123

Good luck!
```

**For Bye Players:**
```
Subject: Bye Round: Friday Blitz - Round 1

Hello John,

You have a BYE for Round 1 of Friday Blitz.

This means you automatically receive 1 point for this round without playing.

You'll be paired for the next round based on the current standings.
```

### 3. Players Check "My Matches"

Players can go to: `http://localhost:3000/my-matches`

Enter their Lichess username to see:
- ⏳ Upcoming matches (pending)
- ⚡ Active matches (in progress)
- ✓ Completed matches (finished)

Each match shows:
- Opponent name and Lichess username
- Round number
- **"Challenge on Lichess" button** - Direct link to challenge opponent
- Match status
- Result (if completed)

### 4. Players Play on Lichess

Click "Challenge on Lichess" button → Opens Lichess with opponent pre-selected

### 5. Results Sync Automatically

Background script syncs results every 30 seconds

## Email Configuration

### Development (Current Setup)

Emails print to console:

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

Check Django console to see emails!

### Production Setup

For real emails, update `settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'noreply@kompetitions.com'
```

## Notification Types

### 1. Match Pairing Notification
- Sent when match is created
- Includes opponent info
- Direct Lichess challenge link
- Match details link

### 2. Bye Notification
- Sent to player with bye
- Explains they get 1 point
- No action needed

### 3. Round Start Notification
- Sent to all participants
- Announces round has started
- Link to competition page

### 4. Result Notification (Optional)
- Can be enabled to notify when results are synced
- Shows final result and winner
- Link to leaderboard

## Player Workflow

### Step 1: Receive Email
Player gets email: "You've been paired for Round 1!"

### Step 2: Check Match Details
Two options:
- Click link in email → Goes to match detail page
- Go to "My Matches" page → See all matches

### Step 3: Challenge Opponent
Click "Challenge on Lichess" button
- Opens Lichess
- Opponent pre-selected
- Create challenge
- Play game!

### Step 4: Wait for Result
- Game finishes on Lichess
- Background script syncs result
- Leaderboard updates automatically
- (Optional) Receive result notification email

### Step 5: Next Round
- Wait for admin to generate next round
- Receive new pairing notification
- Repeat!

## Features

### ✅ Automatic Notifications
- No manual work needed
- Sent when pairings are generated
- All players notified simultaneously

### ✅ Direct Lichess Links
- One-click to challenge opponent
- Pre-filled opponent username
- Easy to start game

### ✅ My Matches Page
- See all your matches
- Upcoming and completed
- Quick access to challenge links

### ✅ Email Tracking
- All emails logged in console (dev)
- Can see who was notified
- Debug email issues easily

## Testing Notifications

### 1. Generate Pairings
```bash
# Start Django server
python manage.py runserver

# Check console output
```

### 2. Look for Email Output
```
✓ Sent notification to player1@example.com
✓ Sent notification to player2@example.com
✓ Sent round start notification to 8 participants

Content-Type: text/plain; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Subject: Match Pairing: Friday Blitz - Round 1
From: noreply@kompetitions.com
To: player1@example.com

Hello John,
...
```

### 3. Test My Matches Page
1. Go to http://localhost:3000/my-matches
2. Enter Lichess username
3. See all matches
4. Click "Challenge on Lichess"

## Customization

### Change Email Template

Edit `chess_app/notifications.py`:

```python
def send_player_notification(participant, match, is_player1=True):
    # Customize message here
    message = f"""
    Your custom message...
    """
```

### Add More Notifications

Add to `chess_app/notifications.py`:

```python
def send_reminder_notification(match):
    """Send reminder 1 hour before match"""
    # Your code here
```

### Disable Notifications

Comment out in `chess_app/swiss_pairing.py`:

```python
# send_match_pairing_notification(match)  # Disabled
```

## Files

- `chess_app/notifications.py` - Notification functions
- `chess_app/swiss_pairing.py` - Calls notifications when creating matches
- `frontend/app/my-matches/page.tsx` - My Matches page
- `chess_competition/settings.py` - Email configuration

## Benefits

### For Players
- 📧 Know immediately when paired
- 🎮 One-click to start game
- 📊 See all matches in one place
- ⚡ Fast and convenient

### For Organizers
- 🤖 Fully automatic
- 📢 All players notified instantly
- 📝 Email log for tracking
- 🎯 Professional experience

## Next Steps

1. **Test in Development**
   - Generate pairings
   - Check console for emails
   - Test My Matches page

2. **Configure Production Email**
   - Set up SMTP
   - Update settings.py
   - Test real emails

3. **Customize Messages**
   - Edit notification templates
   - Add your branding
   - Include tournament rules

4. **Add More Features**
   - SMS notifications
   - Push notifications
   - Reminder emails
   - Result notifications

---

**Your players now get automatic notifications when paired!** 📧🎮
