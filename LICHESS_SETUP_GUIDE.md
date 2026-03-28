# Lichess OAuth Integration - Setup Guide

## Overview
This guide will help you complete the Lichess OAuth integration for Kompetition.com Chess Module.

## What's Already Implemented ✅

### 1. OAuth Flow
- ✅ Login with Lichess button on login page
- ✅ Sign up with Lichess button on registration page
- ✅ OAuth callback handler
- ✅ Automatic user creation from Lichess account
- ✅ Auto-linking of participants with matching Lichess username

### 2. User Dashboard
- ✅ Lichess connection status display
- ✅ Connect Lichess Account button
- ✅ Disconnect Lichess Account button
- ✅ Session-based token storage

### 3. Tournament Features
- ✅ Lichess connection check on participant registration
- ✅ Auto-fill Lichess username when connected
- ✅ Warning message if not connected
- ✅ Automatic participant linking

### 4. API Functions (Ready to Use)
- ✅ `get_lichess_game_data()` - Fetch game results
- ✅ `create_lichess_challenge()` - Create game challenges
- ✅ `get_user_ongoing_games()` - Get active games
- ✅ `verify_lichess_username()` - Verify username exists

## What You Need to Do 🔧

### Step 1: Register Your Application on Lichess

1. Go to https://lichess.org/account/oauth/app
2. Click "New OAuth App"
3. Fill in the details:
   - **Name**: Kompetition Chess Module
   - **Homepage URL**: http://localhost:8000 (for development)
   - **Callback URL**: http://localhost:8000/accounts/lichess/callback/
   - **Description**: Chess competition management module for Kompetition.com
4. Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Step 2: Add Credentials to Settings

Open `chess_competition/settings.py` and update these lines:

```python
# Lichess OAuth Configuration
LICHESS_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'  # Paste your Client ID
LICHESS_CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'  # Paste your Client Secret
LICHESS_REDIRECT_URI = 'http://localhost:8000/accounts/lichess/callback/'
```

**For Production:**
```python
import os

LICHESS_CLIENT_ID = os.environ.get('LICHESS_CLIENT_ID', '')
LICHESS_CLIENT_SECRET = os.environ.get('LICHESS_CLIENT_SECRET', '')
LICHESS_REDIRECT_URI = os.environ.get('LICHESS_REDIRECT_URI', 'https://yourdomain.com/accounts/lichess/callback/')
```

### Step 3: Install Required Packages

```bash
pip install requests
```

Update `requirements.txt`:
```
requests==2.31.0
```

### Step 4: Test the Integration

1. Start the development server:
```bash
python manage.py runserver
```

2. Visit http://localhost:8000

3. Click "Enter as Player" → "Sign in with Lichess"

4. You should be redirected to Lichess authorization page

5. Click "Authorize" on Lichess

6. You should be redirected back and logged in automatically

## How It Works 🔄

### User Login Flow

```
User clicks "Login with Lichess"
    ↓
Redirected to Lichess OAuth page
    ↓
User authorizes the app
    ↓
Lichess redirects back with code
    ↓
App exchanges code for access token
    ↓
App fetches user info from Lichess
    ↓
App creates/finds user account
    ↓
App auto-links participants
    ↓
User is logged in
```

### Match Creation Flow (When Implemented)

```
Admin creates match
    ↓
System checks if admin has Lichess token
    ↓
If yes: Create Lichess challenge via API
    ↓
Challenge URL sent to both players
    ↓
Players click link → Play on Lichess
    ↓
Game ends on Lichess
    ↓
System syncs result back (webhook/polling)
    ↓
Leaderboard updates automatically
```

## Features Available Now 🎯

### For Users:
1. **Login with Lichess** - One-click authentication
2. **Auto-linking** - Past participations automatically linked
3. **Connection Status** - See if Lichess is connected in dashboard
4. **Easy Registration** - Lichess username pre-filled

### For Admins:
1. **Verified Usernames** - All Lichess usernames are verified
2. **Token Storage** - Access tokens stored in session
3. **API Ready** - Functions ready to create challenges and fetch games

## Next Steps (After You Add Credentials) 🚀

### 1. Real-time Game Syncing
You'll need to implement one of these methods:

**Option A: Webhooks (Recommended)**
- Lichess sends updates when games end
- Requires public URL (use ngrok for testing)
- Most efficient and real-time

**Option B: Polling**
- Periodically check game status
- Works with localhost
- Simpler but less efficient

### 2. Match Challenge Creation
When admin creates a match:
- Automatically create Lichess challenge
- Send challenge URL to both players
- Store game ID in match record

### 3. Automatic Result Syncing
When game ends on Lichess:
- Fetch game result via API
- Update match status
- Update leaderboard
- Notify participants

## API Functions Reference 📚

### `lichess_auth.get_lichess_game_data(game_id, access_token=None)`
Fetch game data from Lichess.

```python
game_data = get_lichess_game_data('abc123xyz', request.session.get('lichess_token'))
if game_data:
    winner = game_data['winner']  # 'white', 'black', or None for draw
    status = game_data['status']  # 'mate', 'resign', 'draw', etc.
```

### `lichess_auth.create_lichess_challenge(player1, player2, time_control, token)`
Create a challenge between two players.

```python
challenge = create_lichess_challenge(
    'player1_username',
    'player2_username',
    '10+0',  # 10 minutes, no increment
    request.session.get('lichess_token')
)
if challenge:
    challenge_url = challenge['challenge']['url']
    # Send URL to players
```

### `lichess_auth.get_user_ongoing_games(username, token)`
Get user's active games.

```python
games = get_user_ongoing_games(
    request.session.get('lichess_username'),
    request.session.get('lichess_token')
)
for game in games:
    game_id = game['gameId']
    opponent = game['opponent']['username']
```

### `lichess_auth.verify_lichess_username(username)`
Check if username exists on Lichess.

```python
if verify_lichess_username('someuser'):
    # Username exists
    pass
```

## Testing Checklist ✓

- [ ] Register app on Lichess
- [ ] Add Client ID and Secret to settings
- [ ] Test "Login with Lichess" button
- [ ] Verify user creation
- [ ] Test participant auto-linking
- [ ] Check dashboard connection status
- [ ] Test "Connect Lichess Account" button
- [ ] Test "Disconnect" button
- [ ] Verify Lichess username pre-fill on registration

## Troubleshooting 🔧

### "Lichess OAuth is not configured"
- Make sure you added Client ID and Secret to settings.py
- Restart the development server

### "Failed to obtain access token"
- Check that redirect URI matches exactly
- Verify Client Secret is correct
- Check Lichess app settings

### "No authorization code received"
- User may have denied authorization
- Check callback URL is correct

### "Failed to fetch Lichess account information"
- Token may be invalid
- Check Lichess API status

## Security Notes 🔒

1. **Never commit credentials** - Use environment variables in production
2. **HTTPS required** - Lichess requires HTTPS in production
3. **Token storage** - Currently in session, consider database for persistence
4. **Scope limitation** - Only request necessary scopes

## Production Deployment 🌐

### Update Callback URL
1. Go to Lichess app settings
2. Update callback URL to: `https://yourdomain.com/accounts/lichess/callback/`
3. Update `LICHESS_REDIRECT_URI` in settings

### Environment Variables
```bash
export LICHESS_CLIENT_ID="your_client_id"
export LICHESS_CLIENT_SECRET="your_client_secret"
export LICHESS_REDIRECT_URI="https://yourdomain.com/accounts/lichess/callback/"
```

### HTTPS Configuration
```python
# settings.py
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

## Support 💬

If you encounter issues:
1. Check Lichess API documentation: https://lichess.org/api
2. Verify OAuth app settings on Lichess
3. Check Django logs for detailed errors
4. Test with a fresh Lichess account

## What's Next? 🎮

Once OAuth is working, you can implement:
1. **Automatic challenge creation** when matches are created
2. **Real-time game syncing** via webhooks or polling
3. **Live game status** display on match pages
4. **Automatic leaderboard updates** when games end
5. **Game analysis** integration from Lichess
6. **Tournament pairing** with Lichess challenges

Everything is ready - just add your Lichess OAuth credentials and test!
