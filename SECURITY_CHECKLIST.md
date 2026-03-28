# Security Checklist for Production Deployment

## ⚠️ CRITICAL - Before First Git Push

- [x] Remove hardcoded secrets from settings.py
- [x] Move all sensitive data to environment variables
- [x] Update .env.example with proper documentation
- [ ] **REVOKE exposed Lichess API token** at https://lichess.org/account/oauth/token
- [ ] Generate new Lichess API token for production
- [ ] Generate new Django SECRET_KEY
- [ ] Change database password from default

## 🔒 Environment Configuration

### Development (.env for local)
```bash
DEBUG=True
DJANGO_SECRET_KEY=<dev-key>
DB_PASSWORD=<dev-password>
LICHESS_API_TOKEN=<dev-token>
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Production (.env for server)
```bash
DEBUG=False
DJANGO_SECRET_KEY=<strong-production-key>
DB_PASSWORD=<strong-production-password>
LICHESS_API_TOKEN=<production-token>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

## 🛡️ Django Security Settings

### Already Configured ✅
- [x] SECRET_KEY from environment
- [x] DEBUG from environment
- [x] ALLOWED_HOSTS from environment
- [x] Database credentials from environment
- [x] Lichess API token from environment
- [x] CORS configuration
- [x] CSRF protection
- [x] Session security (HttpOnly cookies)
- [x] Password validators
- [x] Audit logging middleware

### Production Settings (settings_production.py) ✅
- [x] SECURE_SSL_REDIRECT = True
- [x] SESSION_COOKIE_SECURE = True
- [x] CSRF_COOKIE_SECURE = True
- [x] SECURE_BROWSER_XSS_FILTER = True
- [x] SECURE_CONTENT_TYPE_NOSNIFF = True
- [x] X_FRAME_OPTIONS = 'DENY'

## 📝 Pre-Deployment Checklist

### Code Security
- [ ] Run `safety check` for vulnerable dependencies
- [ ] Run `bandit -r .` for security issues
- [ ] Review all user inputs for SQL injection
- [ ] Review all user inputs for XSS
- [ ] Verify all admin views have @login_required and @user_passes_test
- [ ] Verify all API endpoints have proper permissions
- [ ] Check for exposed API keys in code
- [ ] Check for hardcoded passwords

### Database Security
- [ ] Use strong database password (20+ characters)
- [ ] Restrict database access to localhost only
- [ ] Enable database SSL connections
- [ ] Set up automated backups
- [ ] Test backup restoration

### Server Security
- [ ] Configure firewall (UFW/iptables)
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Keep system packages updated
- [ ] Configure fail2ban
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure security headers in Nginx

### Application Security
- [ ] Set DEBUG=False in production
- [ ] Use HTTPS for all requests
- [ ] Implement rate limiting
- [ ] Set up monitoring (Sentry)
- [ ] Configure logging
- [ ] Set up log rotation
- [ ] Implement CSRF protection
- [ ] Validate all file uploads
- [ ] Sanitize all user inputs

## 🔐 Secrets Management

### What Should NEVER Be in Git
- `.env` file
- `db.sqlite3` (if using SQLite)
- `*.pyc` files
- `__pycache__/` directories
- `venv/` or `env/` directories
- API keys or tokens
- Database passwords
- Email passwords
- SSL certificates/keys

### What Should Be in Git
- `.env.example` (template without real values)
- `.gitignore` (properly configured)
- `settings.py` (using environment variables)
- `settings_production.py` (using environment variables)

## 🚨 If Secrets Are Exposed

### Immediate Actions
1. **Revoke all exposed credentials immediately**
   - Lichess API token: https://lichess.org/account/oauth/token
   - Database password: Change in PostgreSQL
   - Django SECRET_KEY: Generate new one
   - Email password: Change or regenerate app password

2. **Generate new credentials**
   ```bash
   # New Django SECRET_KEY
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

3. **Update all environments**
   - Development .env
   - Production .env
   - CI/CD secrets

4. **Force push to remove from git history** (if committed)
   ```bash
   # WARNING: This rewrites history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```

5. **Rotate all sessions**
   ```bash
   python manage.py clearsessions
   ```

## 📊 Security Monitoring

### Set Up Monitoring
- [ ] Configure Sentry for error tracking
- [ ] Set up log monitoring (ELK/Splunk)
- [ ] Monitor failed login attempts
- [ ] Monitor API rate limits
- [ ] Set up uptime monitoring
- [ ] Configure security alerts

### Regular Security Tasks
- [ ] Weekly: Review audit logs
- [ ] Weekly: Check for failed login attempts
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review user permissions
- [ ] Quarterly: Security audit
- [ ] Quarterly: Penetration testing

## 🔍 Security Testing

### Before Production
```bash
# Check for security issues
pip install safety bandit
safety check
bandit -r chess_app/ chess_competition/

# Check for outdated packages
pip list --outdated

# Run Django security checks
python manage.py check --deploy
```

### Penetration Testing
- [ ] Test SQL injection on all forms
- [ ] Test XSS on all user inputs
- [ ] Test CSRF protection
- [ ] Test authentication bypass
- [ ] Test authorization bypass
- [ ] Test rate limiting
- [ ] Test file upload vulnerabilities

## 📚 Additional Resources

- Django Security Checklist: https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Django Security Best Practices: https://docs.djangoproject.com/en/4.2/topics/security/

## ✅ Final Verification

Before going live:
```bash
# 1. Verify no secrets in code
grep -r "password\|secret\|token\|api_key" --include="*.py" --exclude-dir=venv .

# 2. Verify DEBUG=False
grep "DEBUG = True" chess_competition/settings*.py

# 3. Verify .env not in git
git ls-files | grep "\.env$"

# 4. Run security checks
python manage.py check --deploy --settings=chess_competition.settings_production

# 5. Test with production settings locally
python manage.py runserver --settings=chess_competition.settings_production
```

---

**Remember: Security is an ongoing process, not a one-time task!**
