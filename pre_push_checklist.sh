#!/bin/bash

# Pre-Push Security Checklist Script
# Run this before pushing to GitHub

echo "🔍 Running Pre-Push Security Checks..."
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Verify .env is in .gitignore
echo "1. Checking .gitignore for .env..."
if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✓${NC} .env is in .gitignore"
else
    echo -e "${RED}✗${NC} .env is NOT in .gitignore - ADD IT NOW!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Verify .env is not tracked by git
echo "2. Checking if .env is tracked by git..."
if git ls-files | grep -q "^\.env$"; then
    echo -e "${RED}✗${NC} .env is tracked by git - REMOVE IT NOW!"
    echo "   Run: git rm --cached .env"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} .env is not tracked by git"
fi
echo ""

# Check 3: Check for hardcoded secrets
echo "3. Checking for hardcoded secrets..."
SECRETS_FOUND=$(grep -r "password\|secret\|token\|api_key" --include="*.py" --exclude-dir=venv --exclude-dir=env . | grep -v "environ.get" | grep -v "# " | grep -v "\"\"\"" | wc -l)
if [ "$SECRETS_FOUND" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $SECRETS_FOUND potential hardcoded secrets:"
    grep -r "password\|secret\|token\|api_key" --include="*.py" --exclude-dir=venv --exclude-dir=env . | grep -v "environ.get" | grep -v "# " | grep -v "\"\"\"" | head -5
    echo "   Review these carefully!"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} No hardcoded secrets found"
fi
echo ""

# Check 4: Verify DEBUG is not hardcoded to True
echo "4. Checking DEBUG setting..."
if grep -q "DEBUG = True" chess_competition/settings.py; then
    echo -e "${YELLOW}⚠${NC} DEBUG = True found in settings.py"
    echo "   Make sure it uses environment variable in production"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} DEBUG is configured via environment"
fi
echo ""

# Check 5: Check for database passwords
echo "5. Checking for hardcoded database passwords..."
if grep -q "'PASSWORD': '[^']" chess_competition/settings.py | grep -v "environ.get"; then
    echo -e "${RED}✗${NC} Hardcoded database password found!"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} Database password uses environment variable"
fi
echo ""

# Check 6: Check for API tokens
echo "6. Checking for hardcoded API tokens..."
if grep -q "LICHESS_API_TOKEN = 'lip_" chess_competition/settings.py; then
    echo -e "${RED}✗${NC} Hardcoded Lichess API token found!"
    echo "   REVOKE THIS TOKEN IMMEDIATELY at https://lichess.org/account/oauth/token"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} API token uses environment variable"
fi
echo ""

# Check 7: Verify .env.example exists
echo "7. Checking for .env.example..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓${NC} .env.example exists"
else
    echo -e "${RED}✗${NC} .env.example not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 8: Verify migrations exist
echo "8. Checking for migrations..."
if [ -d "chess_app/migrations" ] && [ "$(ls -A chess_app/migrations/*.py 2>/dev/null | wc -l)" -gt 1 ]; then
    echo -e "${GREEN}✓${NC} Migrations exist"
else
    echo -e "${YELLOW}⚠${NC} No migrations found - run makemigrations"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 9: Verify requirements.txt exists
echo "9. Checking for requirements.txt..."
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} requirements.txt exists"
else
    echo -e "${YELLOW}⚠${NC} requirements.txt not found"
    echo "   Run: pip freeze > requirements.txt"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 10: Check for __pycache__ in git
echo "10. Checking for __pycache__ in git..."
if git ls-files | grep -q "__pycache__"; then
    echo -e "${YELLOW}⚠${NC} __pycache__ directories are tracked"
    echo "   Run: git rm -r --cached **/__pycache__"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} No __pycache__ in git"
fi
echo ""

# Summary
echo "======================================"
echo "Summary:"
echo "======================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "✅ Your code is ready for git push!"
    echo ""
    echo "⚠️  IMPORTANT REMINDERS:"
    echo "1. Revoke exposed Lichess token at https://lichess.org/account/oauth/token"
    echo "2. Generate new token for production"
    echo "3. Create .env file with production values (DO NOT COMMIT)"
    echo "4. Generate new SECRET_KEY for production"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Review warnings above before pushing."
    echo ""
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo ""
    echo "❌ FIX ERRORS BEFORE PUSHING TO GIT!"
    echo ""
    exit 1
fi
