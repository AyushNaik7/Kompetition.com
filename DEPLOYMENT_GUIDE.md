# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Code Cleanup ✅
- [x] Remove test files
- [x] Remove debug scripts
- [x] Clean up duplicate code
- [x] Add proper error handling
- [x] Create production settings

### 2. Security Checklist

- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable rate limiting

### 3. Database Setup

- [ ] Create production PostgreSQL database
- [ ] Run migrations
- [ ] Create superuser
- [ ] Set up automated backups
- [ ] Configure connection pooling

### 4. Email Configuration

- [ ] Set up SMTP server (Gmail/SendGrid/AWS SES)
- [ ] Configure email templates
- [ ] Test email delivery
- [ ] Set up email monitoring

### 5. Frontend Build

- [ ] Update API URLs
- [ ] Build for production
- [ ] Configure CDN
- [ ] Set up static file serving
- [ ] Enable compression

## Step-by-Step Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3-pip python3-venv postgresql nginx -y

# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql

CREATE DATABASE kompetitions_db;
CREATE USER kompetitions_user WITH PASSWORD 'your-secure-password';
ALTER ROLE kompetitions_user SET client_encoding TO 'utf8';
ALTER ROLE kompetitions_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kompetitions_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE kompetitions_db TO kompetitions_user;
\q
```

### Step 3: Backend Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/kompetitions.git
cd kompetitions

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Create .env file
cp .env.example .env
nano .env  # Edit with your values

# Run migrations
python manage.py migrate --settings=chess_competition.settings_production

# Create superuser
python manage.py createsuperuser --settings=chess_competition.settings_production

# Collect static files
python manage.py collectstatic --settings=chess_competition.settings_production --noinput

# Create logs directory
mkdir -p logs
```

### Step 4: Gunicorn Setup

Create `/etc/systemd/system/kompetitions.service`:

```ini
[Unit]
Description=Kompetitions Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/kompetitions
Environment="PATH=/path/to/kompetitions/venv/bin"
EnvironmentFile=/path/to/kompetitions/.env
ExecStart=/path/to/kompetitions/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/path/to/kompetitions/kompetitions.sock \
    --settings=chess_competition.settings_production \
    chess_competition.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
# Start and enable service
sudo systemctl start kompetitions
sudo systemctl enable kompetitions
sudo systemctl status kompetitions
```

### Step 5: Background Sync Service

Create `/etc/systemd/system/kompetitions-sync.service`:

```ini
[Unit]
Description=Kompetitions Match Result Sync
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/kompetitions
Environment="PATH=/path/to/kompetitions/venv/bin"
EnvironmentFile=/path/to/kompetitions/.env
ExecStart=/path/to/kompetitions/venv/bin/python sync_ongoing_matches.py
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

```bash
# Start and enable sync service
sudo systemctl start kompetitions-sync
sudo systemctl enable kompetitions-sync
sudo systemctl status kompetitions-sync
```

### Step 6: Nginx Configuration

Create `/etc/nginx/sites-available/kompetitions`:

```nginx
upstream kompetitions_backend {
    server unix:/path/to/kompetitions/kompetitions.sock fail_timeout=0;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location /static/ {
        alias /path/to/kompetitions/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /path/to/kompetitions/media/;
        expires 30d;
    }

    location / {
        proxy_pass http://kompetitions_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kompetitions /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Frontend Deployment

```bash
cd frontend

# Install dependencies
npm install

# Create production .env
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
EOF

# Build for production
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "kompetitions-frontend" -- start
pm2 save
pm2 startup
```

### Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d api.yourdomain.com -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Monitoring Setup

```bash
# Install monitoring tools
pip install sentry-sdk

# Add to settings_production.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True
)
```

## Post-Deployment

### 1. Verify Services

```bash
# Check Django
sudo systemctl status kompetitions

# Check sync service
sudo systemctl status kompetitions-sync

# Check Nginx
sudo systemctl status nginx

# Check logs
sudo journalctl -u kompetitions -f
sudo journalctl -u kompetitions-sync -f
tail -f logs/django.log
```

### 2. Test Functionality

- [ ] Visit https://yourdomain.com
- [ ] Create test competition
- [ ] Register test participant
- [ ] Generate Swiss pairings
- [ ] Create match
- [ ] Sync result
- [ ] Check email notifications
- [ ] Verify leaderboard

### 3. Performance Optimization

```bash
# Enable Gzip compression in Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Set up Redis for caching (optional)
sudo apt install redis-server
pip install django-redis

# Configure in settings
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### 4. Backup Strategy

```bash
# Database backup script
cat > /usr/local/bin/backup-kompetitions.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/kompetitions"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U kompetitions_user kompetitions_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /path/to/kompetitions/media/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-kompetitions.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-kompetitions.sh
```

## Environment Variables Reference

### Required Variables

```bash
DJANGO_SECRET_KEY=          # Generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
DB_PASSWORD=                # Strong database password
EMAIL_HOST_USER=            # SMTP email address
EMAIL_HOST_PASSWORD=        # SMTP password or app password
LICHESS_API_TOKEN=          # Lichess Personal API Token
ALLOWED_HOSTS=              # Comma-separated list of domains
CORS_ALLOWED_ORIGINS=       # Comma-separated list of frontend URLs
```

### Optional Variables

```bash
DEBUG=False
DB_NAME=kompetitions_db
DB_USER=postgres
DB_HOST=localhost
DB_PORT=5432
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

## Troubleshooting

### Issue: 502 Bad Gateway

```bash
# Check Gunicorn
sudo systemctl status kompetitions
sudo journalctl -u kompetitions -n 50

# Check socket file
ls -la /path/to/kompetitions/kompetitions.sock

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Issue: Static Files Not Loading

```bash
# Recollect static files
python manage.py collectstatic --clear --noinput

# Check Nginx configuration
sudo nginx -t

# Check file permissions
sudo chown -R www-data:www-data /path/to/kompetitions/staticfiles/
```

### Issue: Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U kompetitions_user -d kompetitions_db -h localhost

# Check .env file
cat .env | grep DB_
```

### Issue: Email Not Sending

```bash
# Test SMTP connection
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])

# Check email logs
tail -f logs/django.log | grep email
```

## Maintenance

### Regular Tasks

```bash
# Update dependencies
pip install -r requirements.txt --upgrade

# Run migrations
python manage.py migrate

# Clear old sessions
python manage.py clearsessions

# Check for security issues
pip install safety
safety check
```

### Monitoring Commands

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check active connections
netstat -an | grep :8000 | wc -l

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('kompetitions_db'));"
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (Nginx/HAProxy)
- Multiple Gunicorn workers
- Separate database server
- Redis for session storage
- CDN for static files

### Vertical Scaling

- Increase Gunicorn workers
- Optimize database queries
- Add database indexes
- Enable query caching
- Use connection pooling

---

**Your production deployment is complete!** 🚀
