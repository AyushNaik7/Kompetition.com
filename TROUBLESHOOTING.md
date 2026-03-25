# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Issue: "django-admin: command not found"
**Solution:**
```bash
# Ensure Django is installed
pip install Django

# Or use python -m django instead
python -m django startproject myproject
```

#### Issue: "Module not found" errors
**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### Issue: "Permission denied" on setup.sh
**Solution:**
```bash
chmod +x setup.sh
./setup.sh
```

### Database Issues

#### Issue: "no such table" errors
**Solution:**
```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate
```

#### Issue: "database is locked"
**Solution:**
```bash
# Stop all running Django processes
# Delete database and recreate
rm db.sqlite3
python manage.py migrate
```

#### Issue: Migration conflicts
**Solution:**
```bash
# Delete migration files (except __init__.py)
rm chess_app/migrations/0*.py

# Recreate migrations
python manage.py makemigrations
python manage.py migrate
```

### Server Issues

#### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Use different port
python manage.py runserver 8001

# Or kill process using port 8000
# Linux/Mac:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

#### Issue: "CSRF verification failed"
**Solution:**
```bash
# For API testing, disable CSRF temporarily
# Or use proper CSRF token in requests
# Or add to CSRF_TRUSTED_ORIGINS in settings.py
```

#### Issue: Static files not loading
**Solution:**
```bash
# Collect static files
python manage.py collectstatic

# Or ensure DEBUG=True for development
```

### Lichess Integration Issues

#### Issue: "Failed to sync result: 404"
**Cause:** Invalid game ID or game doesn't exist

**Solution:**
```bash
# Verify game ID is correct
# Check game exists: https://lichess.org/{gameId}
# Use sample game IDs for testing:
# - dKbV8Oba
# - q7ZvsdUF
# - GpYhZPz3
```

#### Issue: "Failed to sync result: Timeout"
**Cause:** Network issues or Lichess API slow

**Solution:**
```bash
# Check internet connection
# Try again after a moment
# Increase timeout in api_views.py if needed
```

#### Issue: "Failed to sync result: Invalid JSON"
**Cause:** Game not completed or API response changed

**Solution:**
```bash
# Ensure game is completed on Lichess
# Check game status manually
# Review sync log in admin panel
```

#### Issue: Result synced but shows wrong winner
**Cause:** Result mapping issue

**Solution:**
```bash
# Check Lichess API response format
# Review _fetch_lichess_game() method
# Check sync log for raw data
```

### Validation Issues

#### Issue: "You have already registered"
**Cause:** Duplicate email for same competition

**Solution:**
- This is expected behavior (anti-abuse control)
- Use different email address
- Or delete existing registration in admin panel

#### Issue: "Player 1 and Player 2 cannot be the same"
**Cause:** Trying to pair player with themselves

**Solution:**
- This is expected behavior (anti-abuse control)
- Select different players

#### Issue: "This Lichess game ID is already used"
**Cause:** Duplicate game ID in same competition

**Solution:**
- This is expected behavior (anti-abuse control)
- Use different game ID
- Or remove existing match with that game ID

#### Issue: "Match is already completed"
**Cause:** Trying to sync result for completed match

**Solution:**
- This is expected behavior (result locking)
- Admin can manually update in admin panel
- Or create new match

#### Issue: "Registration is closed"
**Cause:** Competition not active or outside time window

**Solution:**
```bash
# Check competition dates
# Ensure is_active=True
# Update start/end times if needed
```

### API Issues

#### Issue: API returns 404 for valid endpoint
**Solution:**
```bash
# Check URL format
# Ensure trailing slash: /api/chess/competitions/
# Verify ID exists in database
```

#### Issue: API returns 400 Bad Request
**Solution:**
```bash
# Check request body format (JSON)
# Verify all required fields included
# Check validation error message in response
```

#### Issue: API returns empty list
**Solution:**
```bash
# Ensure data exists in database
# Check filters (e.g., active competitions)
# Create demo data: python manage.py shell < create_demo_data.py
```

#### Issue: CORS errors in browser
**Solution:**
```bash
# Install django-cors-headers
pip install django-cors-headers

# Add to INSTALLED_APPS in settings.py
# Configure CORS_ALLOWED_ORIGINS
```

### Form Issues

#### Issue: Form doesn't save
**Solution:**
```bash
# Check form.is_valid() returns True
# Review validation errors
# Check model constraints
# Review server logs
```

#### Issue: DateTime field shows wrong format
**Solution:**
```bash
# Use datetime-local input type
# Format: YYYY-MM-DDTHH:MM
# Example: 2026-05-10T10:00
```

#### Issue: Dropdown shows no options
**Solution:**
```bash
# Ensure queryset is set in form __init__
# Check data exists in database
# Verify foreign key relationships
```

### Leaderboard Issues

#### Issue: Points not calculating correctly
**Solution:**
```bash
# Verify match status is 'completed'
# Check result field values (1-0, 0-1, 1/2-1/2)
# Review leaderboard calculation logic
# Check both player1 and player2 matches counted
```

#### Issue: Ranking order incorrect
**Solution:**
```bash
# Verify sort order: points > wins > registration time
# Check tie-breaking logic
# Ensure registered_at field populated
```

#### Issue: Participant missing from leaderboard
**Solution:**
```bash
# Ensure participant registered for competition
# Check participant not deleted
# Verify competition ID matches
```

### Admin Panel Issues

#### Issue: Can't login to admin
**Solution:**
```bash
# Create superuser
python manage.py createsuperuser

# Reset password
python manage.py changepassword <username>
```

#### Issue: Models not showing in admin
**Solution:**
```bash
# Ensure models registered in admin.py
# Check @admin.register decorator
# Restart server
```

#### Issue: Can't edit completed match
**Solution:**
- This is expected behavior (result locking)
- Use admin override if needed
- Or create new match

### Performance Issues

#### Issue: Leaderboard slow to load
**Solution:**
```bash
# Add database indexes
# Implement caching (Redis)
# Optimize queries with select_related()
# Pre-calculate for large tournaments
```

#### Issue: Many database queries
**Solution:**
```bash
# Use select_related() for foreign keys
# Use prefetch_related() for reverse relations
# Enable Django Debug Toolbar to identify N+1 queries
```

### Testing Issues

#### Issue: test_api.py fails
**Solution:**
```bash
# Ensure server is running
# Check BASE_URL in script
# Verify data exists (competition ID 1, etc.)
# Create demo data first
```

#### Issue: Demo data script fails
**Solution:**
```bash
# Run via shell:
python manage.py shell < create_demo_data.py

# Or manually in shell:
python manage.py shell
>>> exec(open('create_demo_data.py').read())
```

## Debugging Tips

### Enable Debug Mode
```python
# settings.py
DEBUG = True
```

### Check Server Logs
```bash
# Django prints errors to console
# Review terminal output
```

### Use Django Shell
```bash
python manage.py shell

# Test queries
>>> from chess_app.models import *
>>> ChessCompetition.objects.all()
>>> ChessParticipant.objects.filter(competition_id=1)
```

### Check Database Directly
```bash
# SQLite
python manage.py dbshell
sqlite> .tables
sqlite> SELECT * FROM chess_app_chesscompetition;
sqlite> .quit
```

### Test API with curl
```bash
# Verbose output
curl -v http://localhost:8000/api/chess/competitions/

# Pretty print JSON
curl http://localhost:8000/api/chess/competitions/ | python -m json.tool
```

### Review Sync Logs
```bash
# In Django shell
>>> from chess_app.models import ChessResultSyncLog
>>> logs = ChessResultSyncLog.objects.all()
>>> for log in logs:
...     print(f"{log.match}: {log.success} - {log.error_message}")
```

## Getting Help

### Check Documentation
1. README.md - Setup and usage
2. API_DOCUMENTATION.md - API reference
3. IMPLEMENTATION_NOTES.md - Design decisions
4. TESTING.md - Testing procedures

### Review Code Comments
- Models have detailed docstrings
- Views include inline comments
- Forms explain validation logic

### Check Django Documentation
- https://docs.djangoproject.com/
- https://www.django-rest-framework.org/

### Check Lichess API Documentation
- https://lichess.org/api

## Common Error Messages

### "UNIQUE constraint failed"
**Meaning:** Trying to create duplicate record
**Solution:** Check unique constraints in models

### "NOT NULL constraint failed"
**Meaning:** Required field missing
**Solution:** Provide all required fields

### "ForeignKey constraint failed"
**Meaning:** Referenced object doesn't exist
**Solution:** Ensure foreign key object exists

### "ValidationError"
**Meaning:** Data doesn't pass validation
**Solution:** Check validation rules and error message

### "DoesNotExist"
**Meaning:** Object not found in database
**Solution:** Verify object ID and existence

## Prevention Tips

1. **Always activate virtual environment**
2. **Run migrations after model changes**
3. **Check validation errors before debugging**
4. **Use demo data for testing**
5. **Review logs for error details**
6. **Test with sample Lichess game IDs**
7. **Keep dependencies updated**
8. **Backup database before major changes**

## Still Having Issues?

1. Check if issue is documented above
2. Review relevant documentation file
3. Check code comments in affected file
4. Test with demo data
5. Review Django/DRF documentation
6. Check Lichess API status

---

**Note:** Most issues are related to setup, validation, or Lichess integration. Follow the solutions above carefully.
