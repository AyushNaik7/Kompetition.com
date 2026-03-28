# Lichess OAuth Integration Guide

## Overview
This guide explains how to add full Lichess OAuth authentication to the platform, allowing users to login with their Lichess accounts and automatically verify their identity.

## Current Implementation

### What Works Now:
1. **Manual Username Entry**: Users manually enter their Lichess username
2. **Game URL Syncing**: Admins paste Lichess game URLs to sync results
3. **Basic API Integration**: Fetches game data from public Lichess API

### What's Missing:
1. **OAuth Login**: Users can't login with Lichess accounts
2. **Username Verification**: No way to verify users actually own the Lichess username
3. **Automatic Game Syncing**: Can't automatically fetch user's games
4. **Real-time Updates**: No webhooks or live game tracking

## Implementation Steps

### Step 1: Register Your Application on Lichess

1. Go to https://lichess.org/account/oauth/app
2. Click "New OAuth App"
3. Fill in the details:
   - **Name**: Kompetitions Chess Platform
   - **Homepage URL**: http://localhost:8000 (or your domain)
   - **Callback URL**: http://localhost:8000/accounts/lichess/callback/
   - **Description**: Chess competition management platform
4. Save the **Client ID** and **Client Secret**

### Step 2: Install Required Packages

```bash
pip install requests-oauthlib
pip install python-lichess
```

Update `requirements.txt`:
```
requests-oauthlib==1.3.1
python-lichess==0.10
```

### Step 3: Add Lichess OAuth Settings

Add to `chess_competition/settings.py`:

```python
# Lichess OAuth Configuration
LICHESS_CLIENT_ID = 'your_client_id_here'
LICHESS_CLIENT_SECRET = 'your_client_secret_here'
LICHESS_REDIRECT_URI = 'http://localhost:8000/accounts/lichess/callback/'
LICHESS_AUTHORIZE_URL = 'https://lichess.org/oauth'
LICHESS_TOKEN_URL = 'https://lichess.org/api/token'
LICHESS_API_BASE = 'https://lichess.org/api'
```

For production, use environment variables:
```python
import os

LICHESS_CLIENT_ID = os.environ.get('LICHESS_CLIENT_ID', '')
LICHESS_CLIENT_SECRET = os.environ.get('LICHESS_CLIENT_SECRET', '')
LICHESS_REDIRECT_URI = os.environ.get('LICHESS_REDIRECT_URI', 'http://localhost:8000/accounts/lichess/callback/')
```

### Step 4: Create Lichess OAuth Views

Create `chess_app/lichess_auth.py`:

```python
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.contrib import messages
from django.conf import settings
from requests_oauthlib import OAuth2Session
import requests

def lichess_login(request):
    """Initiate Lichess OAuth flow"""
    lichess = OAuth2Session(
        settings.LICHESS_CLIENT_ID,
        redirect_uri=settings.LICHESS_REDIRECT_URI,
        scope=['preference:read', 'email:read']
    )
    
    authorization_url, state = lichess.authorization_url(
        settings.LICHESS_AUTHORIZE_URL
    )
    
    # Save state in session for verification
    request.session['oauth_state'] = state
    
    return redirect(authorization_url)


def lichess_callback(request):
    """Handle Lichess OAuth callback"""
    # Verify state
    state = request.session.get('oauth_state')
    if not state:
        messages.error(request, 'Invalid OAuth state')
        return redirect('login')
    
    # Get authorization code
    code = request.GET.get('code')
    if not code:
        messages.error(request, 'Authorization failed')
        return redirect('login')
    
    # Exchange code for token
    lichess = OAuth2Session(
        settings.LICHESS_CLIENT_ID,
        redirect_uri=settings.LICHESS_REDIRECT_URI,
        state=state
    )
    
    try:
        token = lichess.fetch_token(
            settings.LICHESS_TOKEN_URL,
            code=code,
            client_secret=settings.LICHESS_CLIENT_SECRET
        )
        
        # Get user info from Lichess
        response = requests.get(
            f'{settings.LICHESS_API_BASE}/account',
            headers={'Authorization': f'Bearer {token["access_token"]}'}
        )
        
        if response.status_code == 200:
            lichess_data = response.json()
            lichess_username = lichess_data['username']
            lichess_email = lichess_data.get('email', f'{lichess_username}@lichess.local')
            
            # Find or create user
            user, created = User.objects.get_or_create(
                username=lichess_username,
                defaults={'email': lichess_email}
            )
            
            # Create or update UserProfile
            from chess_app.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            # Store Lichess token in session for API calls
            request.session['lichess_token'] = token['access_token']
            request.session['lichess_username'] = lichess_username
            
            # Login user
            login(request, user)
            
            if created:
                messages.success(request, f'Welcome {lichess_username}! Your account has been created.')
            else:
                messages.success(request, f'Welcome back {lichess_username}!')
            
            return redirect('dashboard')
        else:
            messages.error(request, 'Failed to fetch Lichess account info')
            return redirect('login')
            
    except Exception as e:
        messages.error(request, f'OAuth error: {str(e)}')
        return redirect('login')


def lichess_disconnect(request):
    """Disconnect Lichess account"""
    if 'lichess_token' in request.session:
        del request.session['lichess_token']
    if 'lichess_username' in request.session:
        del request.session['lichess_username']
    
    messages.success(request, 'Lichess account disconnected')
    return redirect('dashboard')
```

### Step 5: Add URL Patterns

Add to `chess_app/urls.py`:

```python
from chess_app import lichess_auth

urlpatterns = [
    # ... existing patterns ...
    
    # Lichess OAuth
    path('accounts/lichess/login/', lichess_auth.lichess_login, name='lichess_login'),
    path('accounts/lichess/callback/', lichess_auth.lichess_callback, name='lichess_callback'),
    path('accounts/lichess/disconnect/', lichess_auth.lichess_disconnect, name='lichess_disconnect'),
]
```

### Step 6: Update Login Page

Add Lichess login button to `chess_app/templates/chess_app/login.html`:

```html
<div style="margin-top: 24px; text-align: center;">
    <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
        <p style="color: #888; margin-bottom: 16px;">Or sign in with</p>
        <a href="{% url 'lichess_login' %}" class="btn" style="background: #000; width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            Sign in with Lichess
        </a>
    </div>
</div>
```

### Step 7: Update Landing Page

Add Lichess login option to `chess_app/templates/chess_app/landing.html`:

```html
<div style="margin-top: 16px;">
    <a href="{% url 'lichess_login' %}" style="color: #ff6b35; text-decoration: none; font-size: 14px;">
        Or sign in with Lichess →
    </a>
</div>
```

### Step 8: Auto-Link Participants

Update `chess_app/lichess_auth.py` callback to automatically link participants:

```python
# After creating/getting user
from chess_app.models import ChessParticipant

# Find all participants with this Lichess username
participants = ChessParticipant.objects.filter(
    lichess_username__iexact=lichess_username
)

# Link them to user profile
if participants.exists():
    profile.linked_participants.add(*participants)
    messages.success(
        request, 
        f'Automatically linked {participants.count()} participant(s) to your account'
    )
```

### Step 9: Fetch User's Games Automatically

Create `chess_app/lichess_api.py`:

```python
import requests
from django.conf import settings

def get_user_games(lichess_token, username, max_games=50):
    """Fetch user's recent games from Lichess"""
    url = f'{settings.LICHESS_API_BASE}/games/user/{username}'
    headers = {'Authorization': f'Bearer {lichess_token}'}
    params = {
        'max': max_games,
        'pgnInJson': 'false',
        'tags': 'true',
        'clocks': 'false',
        'evals': 'false',
        'opening': 'false'
    }
    
    response = requests.get(url, headers=headers, params=params, stream=True)
    
    if response.status_code == 200:
        games = []
        for line in response.iter_lines():
            if line:
                games.append(line.decode('utf-8'))
        return games
    return []


def verify_game_participants(game_id, player1_username, player2_username):
    """Verify that a game was played between two specific users"""
    url = f'{settings.LICHESS_API_BASE}/game/{game_id}'
    response = requests.get(url)
    
    if response.status_code == 200:
        game_data = response.json()
        white = game_data['players']['white']['user']['name'].lower()
        black = game_data['players']['black']['user']['name'].lower()
        
        p1 = player1_username.lower()
        p2 = player2_username.lower()
        
        return (white == p1 and black == p2) or (white == p2 and black == p1)
    
    return False
```

## Benefits of OAuth Integration

### For Users:
1. **One-Click Login**: No need to create separate accounts
2. **Verified Identity**: Lichess username is automatically verified
3. **Auto-Linking**: Past participations automatically linked
4. **Seamless Experience**: Use existing Lichess credentials

### For Admins:
1. **Verified Participants**: No fake usernames
2. **Automatic Game Sync**: Fetch games directly from user accounts
3. **Real-time Data**: Access to live game information
4. **Better Security**: OAuth is more secure than manual entry

## Testing OAuth Integration

### Local Testing:
1. Register app on Lichess with `http://localhost:8000/accounts/lichess/callback/`
2. Add credentials to settings
3. Test login flow
4. Verify user creation and participant linking

### Production Deployment:
1. Update callback URL to production domain
2. Use environment variables for credentials
3. Enable HTTPS (required by Lichess)
4. Test thoroughly before launch

## Alternative: API Token Method

If OAuth is too complex, you can use Lichess API tokens:

1. Users generate personal API token on Lichess
2. Users paste token in platform
3. Platform verifies token and fetches user info
4. Store encrypted token for future API calls

This is simpler but less secure and user-friendly than OAuth.

## Current vs OAuth Comparison

| Feature | Current | With OAuth |
|---------|---------|------------|
| Login Method | Manual username/password | Lichess account |
| Username Verification | None | Automatic |
| Game Access | Manual URL entry | Automatic fetch |
| User Experience | Multiple accounts | Single account |
| Security | Basic | OAuth standard |
| Setup Complexity | Simple | Moderate |

## Recommendation

For a production platform, **implement OAuth** for better security and user experience. For a quick MVP or internal use, the current manual method works fine.

## Next Steps

1. Decide if you want OAuth integration
2. Register app on Lichess
3. Implement OAuth views and URLs
4. Update templates with Lichess login buttons
5. Test thoroughly
6. Deploy with HTTPS

Let me know if you want me to implement this!
