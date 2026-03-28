# Role Selection Flow - Authless Landing Page

## Overview
The landing page is now a **role selection gate** that appears BEFORE authentication. Users choose their interface first, then the system handles authentication as needed.

## User Flow

### 1. Landing Page (No Auth Required)
```
User visits website (/)
↓
Landing Page with 2 options:
├─ Player Card → Competitions List
└─ Admin Card → Participant List (requires login)
```

### 2. Player Flow (Mostly Public)
```
Click "Enter as Player"
↓
Competition List (PUBLIC - no login required)
↓
User can browse:
├─ View competitions
├─ View leaderboards
├─ Use "My Matches" (public search)
└─ View match details

If user tries to:
├─ Register for competition → Redirected to login
├─ Create match → Redirected to login
└─ Access dashboard → Redirected to login
```

### 3. Admin Flow (Requires Auth)
```
Click "Enter as Admin"
↓
Participant List (PROTECTED - requires staff login)
↓
If not authenticated:
├─ Redirected to login page
└─ After login → Back to Participant List

If authenticated as staff:
├─ Access Participant List
├─ Access Match List
├─ Access Audit Log
├─ Generate Swiss Pairings
└─ View Knockout Brackets
```

## Key Features

### Authless Entry
- Landing page has NO authentication check
- Users can choose their interface without logging in
- Public areas are accessible immediately

### Smart Authentication
- Only protected pages require login
- Login redirects back to the page user was trying to access
- Staff users get admin interface
- Regular users get player interface

### Role-Based Access
- **Player Interface**: Mostly public, some features require login
  - Public: Competitions, Leaderboards, My Matches search
  - Protected: Registration, Dashboard, Linking participants
  
- **Admin Interface**: All features require staff login
  - Protected: Participants, Matches, Audit Log, Swiss Pairing

## URL Structure

```
/                           → Landing (role selection)
/competitions/              → Player interface (public)
/participants/              → Admin interface (requires staff login)
/my-matches/                → Public match search
/accounts/login/            → Login page
/accounts/register/         → Registration page
/accounts/profile/          → User dashboard (requires login)
```

## Navigation Behavior

### From Landing Page
- **Home link**: Goes to landing page
- **Brand logo**: Goes to landing page
- **Login/Register**: Available in nav

### After Role Selection
- **Player side**: Navigation shows public links + login/register
- **Admin side**: Navigation shows admin links (if staff) + logout

### After Login
- **Regular user**: Can access dashboard, link participants
- **Staff user**: Can access all admin features

## Benefits

1. **Clear Role Separation**: Users know which interface they're entering
2. **No Forced Login**: Public features accessible immediately
3. **Smart Redirects**: Login sends users back to where they were
4. **Flexible Access**: Users can switch between interfaces anytime
5. **Professional UX**: Clear entry points for different user types

## Example Scenarios

### Scenario 1: New Player
1. Visit website → Landing page
2. Click "Enter as Player" → Competition list
3. Browse competitions (no login needed)
4. Try to register → Redirected to login
5. Click "Register" → Create account
6. After registration → Back to competition registration

### Scenario 2: Returning Admin
1. Visit website → Landing page
2. Click "Enter as Admin" → Redirected to login (not authenticated)
3. Enter credentials → Participant list (admin interface)
4. Access all admin features

### Scenario 3: Public User
1. Visit website → Landing page
2. Click "Enter as Player" → Competition list
3. Browse competitions
4. Use "My Matches" to search by username
5. View leaderboards
6. Never needs to login

### Scenario 4: Logged-in User Returns
1. Visit website → Landing page (always shows)
2. Click "Enter as Player" → Competition list
3. Already logged in, can access dashboard from nav
4. Or click "Enter as Admin" → Participant list (if staff)

## Technical Implementation

### Landing View
```python
def landing(request):
    """Landing page with role selection - no auth required"""
    return render(request, 'chess_app/landing.html')
```

### Login View
```python
def user_login(request):
    # After successful login:
    # - Redirect to 'next' parameter if present
    # - Or redirect based on user role (staff → admin, user → player)
```

### Protected Views
- Use `@login_required` decorator
- Use `@user_passes_test(lambda u: u.is_staff)` for admin views
- Django automatically adds `?next=/current/path/` to login URL

## Files Modified

1. `chess_app/views.py` - Removed auth check from landing view
2. `chess_app/templates/chess_app/landing.html` - Changed buttons to direct interface links
3. `chess_competition/settings.py` - Updated LOGIN_REDIRECT_URL

## Testing Checklist

- [x] Landing page shows without authentication
- [x] "Enter as Player" goes to competition list
- [x] "Enter as Admin" goes to participant list (or login if not authenticated)
- [x] Public features work without login
- [x] Protected features redirect to login with ?next parameter
- [x] After login, user returns to intended page
- [x] Staff users can access admin features
- [x] Regular users cannot access admin features
- [x] Logout returns to landing page
