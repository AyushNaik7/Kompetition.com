# Kompetitions - Chess Competition Management Platform

A comprehensive Django-based chess competition management system with Lichess integration, featuring Swiss-style pairing, knockout brackets, participant management, and audit logging.

## 🚀 Features

### Core Features
- **Competition Management**: Create and manage chess tournaments
- **Participant Registration**: Easy registration with Lichess username
- **Match Tracking**: Automatic result syncing from Lichess
- **Leaderboards**: Real-time standings and statistics

### Advanced Features (v2.0)
- **Swiss-Style Pairing**: Automatic pairing algorithm with rematch prevention
- **Knockout Brackets**: Visual tournament bracket display
- **Participant Management**: Admin views for participant tracking
- **Match History**: Detailed match history per participant
- **My Matches**: Public page for participants to view their matches
- **Audit Logging**: Complete tracking of admin actions
- **User Authentication**: Full registration and login system
- **Participant Linking**: Link Lichess usernames to user accounts

## 📋 Requirements

- Python 3.8+
- PostgreSQL 12+
- Node.js 18+ (for frontend)
- Lichess Personal API Token

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/kompetitions.git
cd kompetitions
```

### 2. Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up Database

```bash
# Create PostgreSQL database
createdb kompetitions_db

# Or using psql:
psql -U postgres
CREATE DATABASE kompetitions_db;
\q
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

Required environment variables:
```bash
DJANGO_SECRET_KEY=<generate-new-key>
DEBUG=True  # Set to False in production
DB_PASSWORD=<your-db-password>
LICHESS_API_TOKEN=<your-lichess-token>
ALLOWED_HOSTS=localhost,127.0.0.1
```

Generate SECRET_KEY:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Get Lichess API Token:
1. Visit https://lichess.org/account/oauth/token
2. Create new personal access token
3. Copy token to .env file

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
```

### 7. Run Development Server

```bash
# Backend (Django)
python manage.py runserver

# Frontend (Next.js) - in separate terminal
cd frontend
npm install
npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## 🏗️ Project Structure

```
kompetitions/
├── chess_app/              # Main Django app
│   ├── models.py          # Database models
│   ├── views.py           # View functions
│   ├── api_views.py       # REST API views
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # URL routing
│   ├── middleware.py      # Custom middleware
│   ├── swiss_pairing.py   # Swiss pairing algorithm
│   ├── utils.py           # Utility functions
│   ├── lichess_api.py     # Lichess integration
│   └── templates/         # HTML templates
├── chess_competition/      # Django project settings
│   ├── settings.py        # Development settings
│   ├── settings_production.py  # Production settings
│   ├── urls.py            # Main URL configuration
│   └── wsgi.py            # WSGI configuration
├── frontend/              # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── lib/               # Utility functions
├── .env.example           # Environment template
├── requirements.txt       # Python dependencies
├── manage.py              # Django management script
├── DEPLOYMENT_GUIDE.md    # Production deployment guide
├── SECURITY_CHECKLIST.md  # Security best practices
└── PRODUCTION_READY.md    # Production readiness status
```

## 🔐 Security

### Before Deployment

1. **Generate New Secrets**
   ```bash
   # Generate Django SECRET_KEY
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   
   # Generate new Lichess API token
   # Visit: https://lichess.org/account/oauth/token
   ```

2. **Run Security Checks**
   ```bash
   # Make script executable
   chmod +x pre_push_checklist.sh
   
   # Run security checks
   ./pre_push_checklist.sh
   ```

3. **Review Security Checklist**
   - Read `SECURITY_CHECKLIST.md` for comprehensive security guide
   - Ensure all environment variables are set
   - Verify DEBUG=False in production
   - Configure HTTPS/SSL

### Security Features

- ✅ Environment-based configuration
- ✅ CSRF protection
- ✅ SQL injection prevention (Django ORM)
- ✅ XSS prevention (Django templates)
- ✅ Password hashing (Django default)
- ✅ Session security
- ✅ Audit logging for admin actions
- ✅ Admin-only access controls
- ✅ HTTPS/SSL support (production)

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Step-by-step production deployment
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices
- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** - Production readiness status
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API endpoints documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[FEATURES_CHECKLIST.md](FEATURES_CHECKLIST.md)** - Feature implementation status

## 🎮 Usage

### Admin Features

1. **Create Competition**
   - Log in to admin panel
   - Create new competition with details
   - Set tournament type (Swiss/Knockout/Round Robin)

2. **Manage Participants**
   - View all participants across competitions
   - Filter by competition or username
   - View match history for each participant

3. **Generate Swiss Pairings**
   - Navigate to competition detail
   - Click "Generate Swiss Pairings"
   - Review and confirm pairings

4. **View Audit Log**
   - Access audit log from admin menu
   - Filter by admin, action type, or date
   - Review all administrative actions

### User Features

1. **Register Account**
   - Click "Register" in navigation
   - Create account with username/email/password
   - Automatically logged in after registration

2. **Link Lichess Username**
   - Log in to your account
   - Go to "Link Participant"
   - Enter your Lichess username
   - View all your matches in dashboard

3. **View My Matches (Public)**
   - No login required
   - Enter Lichess username
   - View all matches across competitions
   - See statistics (wins, losses, draws)

## 🧪 Testing

### Manual Testing

```bash
# Run development server
python manage.py runserver

# Test features:
# 1. User registration and login
# 2. Participant linking
# 3. Swiss pairing generation
# 4. Match list filtering
# 5. Audit log viewing
# 6. My matches search
```

### Security Testing

```bash
# Install security tools
pip install safety bandit

# Check for vulnerable dependencies
safety check

# Check for security issues
bandit -r chess_app/ chess_competition/

# Django security check
python manage.py check --deploy
```

## 🚀 Deployment

### Quick Deployment

1. **Prepare Environment**
   ```bash
   # Set production environment variables
   export DEBUG=False
   export DJANGO_SECRET_KEY=<production-key>
   export DB_PASSWORD=<production-password>
   export LICHESS_API_TOKEN=<production-token>
   export ALLOWED_HOSTS=yourdomain.com
   ```

2. **Run Migrations**
   ```bash
   python manage.py migrate --settings=chess_competition.settings_production
   ```

3. **Collect Static Files**
   ```bash
   python manage.py collectstatic --settings=chess_competition.settings_production
   ```

4. **Start Gunicorn**
   ```bash
   gunicorn chess_competition.wsgi:application --bind 0.0.0.0:8000
   ```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow PEP 8 style guide
- Write descriptive commit messages
- Add tests for new features
- Update documentation
- Run security checks before committing

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Django](https://www.djangoproject.com/) - Web framework
- [Django REST Framework](https://www.django-rest-framework.org/) - API framework
- [Lichess](https://lichess.org/) - Chess platform and API
- [Next.js](https://nextjs.org/) - Frontend framework
- [PostgreSQL](https://www.postgresql.org/) - Database

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review security checklist for security concerns

## 🗺️ Roadmap

### Completed ✅
- [x] Basic competition management
- [x] Lichess integration
- [x] Swiss-style pairing
- [x] Knockout brackets
- [x] Participant management
- [x] Audit logging
- [x] User authentication
- [x] Match history tracking

### Planned 🚧
- [ ] Email notifications
- [ ] Real-time updates (WebSockets)
- [ ] Mobile app
- [ ] Advanced statistics
- [ ] Tournament templates
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Live streaming integration

## 📊 Status

- **Version**: 2.0.0
- **Status**: Production Ready ✅
- **Last Updated**: 2024
- **Security**: Hardened ✅
- **Documentation**: Complete ✅
- **Tests**: Manual testing required

---

**Made with ♟️ by the Kompetitions Team**
