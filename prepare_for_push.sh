#!/bin/bash

# Prepare for Git Push Script
# This script helps you prepare your code for pushing to GitHub

echo "🚀 Preparing Code for Git Push"
echo "==============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Run security checks
echo -e "${BLUE}Step 1: Running Security Checks...${NC}"
echo "-----------------------------------"
if [ -f "pre_push_checklist.sh" ]; then
    chmod +x pre_push_checklist.sh
    ./pre_push_checklist.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ Security checks failed!${NC}"
        echo "Fix the errors above before continuing."
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ pre_push_checklist.sh not found${NC}"
fi
echo ""

# Step 2: Check git status
echo -e "${BLUE}Step 2: Checking Git Status...${NC}"
echo "--------------------------------"
if git ls-files | grep -q "^\.env$"; then
    echo -e "${RED}❌ .env is tracked by git!${NC}"
    echo "Run: git rm --cached .env"
    exit 1
else
    echo -e "${GREEN}✓${NC} .env is not tracked"
fi

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} .env file exists locally (this is OK, just don't commit it)"
else
    echo -e "${YELLOW}⚠${NC} .env file not found - you'll need to create it for local development"
fi
echo ""

# Step 3: Check for migrations
echo -e "${BLUE}Step 3: Checking Migrations...${NC}"
echo "-------------------------------"
if [ -d "chess_app/migrations" ]; then
    MIGRATION_COUNT=$(ls chess_app/migrations/*.py 2>/dev/null | wc -l)
    if [ "$MIGRATION_COUNT" -gt 1 ]; then
        echo -e "${GREEN}✓${NC} Found $MIGRATION_COUNT migration files"
    else
        echo -e "${YELLOW}⚠${NC} No migrations found"
        echo "Run: python manage.py makemigrations"
    fi
else
    echo -e "${RED}❌ Migrations directory not found${NC}"
fi
echo ""

# Step 4: Verify documentation
echo -e "${BLUE}Step 4: Verifying Documentation...${NC}"
echo "-----------------------------------"
DOCS=("README.md" "SECURITY_CHECKLIST.md" "DEPLOYMENT_GUIDE.md" "PRODUCTION_READY.md" ".env.example")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc exists"
    else
        echo -e "${RED}✗${NC} $doc missing"
    fi
done
echo ""

# Step 5: Check Python syntax
echo -e "${BLUE}Step 5: Checking Python Syntax...${NC}"
echo "-----------------------------------"
if command -v python &> /dev/null; then
    python manage.py check --settings=chess_competition.settings 2>&1 | head -10
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} No syntax errors found"
    else
        echo -e "${RED}❌ Syntax errors found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠${NC} Python not found in PATH"
fi
echo ""

# Step 6: Show git status
echo -e "${BLUE}Step 6: Current Git Status...${NC}"
echo "------------------------------"
git status --short
echo ""

# Step 7: Critical reminders
echo -e "${YELLOW}⚠️  CRITICAL REMINDERS BEFORE PUSHING:${NC}"
echo "=========================================="
echo ""
echo "1. ❗ REVOKE any old Lichess tokens:"
echo "   Visit: https://lichess.org/account/oauth/token"
echo "   Revoke any old/unused tokens"
echo ""
echo "2. 🔑 Generate NEW Lichess token for production"
echo ""
echo "3. 📝 Create .env file (if not exists):"
echo "   cp .env.example .env"
echo "   # Edit with your values"
echo ""
echo "4. 🔐 Generate new SECRET_KEY:"
echo "   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
echo ""
echo "5. ✅ Verify .env is NOT in git:"
echo "   git status | grep '.env'"
echo "   # Should only show .env.example"
echo ""

# Step 8: Offer to stage files
echo ""
echo -e "${BLUE}Ready to stage files for commit?${NC}"
read -p "Stage all files? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    echo -e "${GREEN}✓${NC} Files staged"
    echo ""
    echo "Staged files:"
    git status --short
    echo ""
    
    # Verify .env is not staged
    if git diff --cached --name-only | grep -q "^\.env$"; then
        echo -e "${RED}❌ ERROR: .env is staged!${NC}"
        echo "Unstaging .env..."
        git reset HEAD .env
        echo "Please add .env to .gitignore and try again"
        exit 1
    else
        echo -e "${GREEN}✓${NC} .env is not staged (good!)"
    fi
    
    echo ""
    echo -e "${BLUE}Suggested commit message:${NC}"
    echo "----------------------------"
    cat << 'EOF'
feat: implement all features and security hardening

Features:
- Swiss-style pairing algorithm
- Knockout bracket visualization
- Participant management views
- Match history tracking
- Audit logging system
- User authentication system
- Participant linking functionality

Security:
- Move all secrets to environment variables
- Remove hardcoded passwords and tokens
- Add comprehensive security documentation
- Implement audit logging middleware

Documentation:
- Add comprehensive README
- Add security checklist
- Add deployment guide
- Add production readiness status

Technical:
- Django 4.2.11
- PostgreSQL database
- Lichess API integration
- Next.js frontend
EOF
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Review staged files: git status"
    echo "2. Commit: git commit -m \"your message\""
    echo "3. Push: git push origin main"
else
    echo "Skipping staging. You can manually stage files with: git add <files>"
fi

echo ""
echo -e "${GREEN}✅ Pre-push preparation complete!${NC}"
echo ""
echo "📋 Final checklist:"
echo "  [ ] Revoked exposed Lichess token"
echo "  [ ] Generated new tokens"
echo "  [ ] Created .env file (not committed)"
echo "  [ ] Verified .env in .gitignore"
echo "  [ ] Reviewed staged files"
echo "  [ ] Ready to commit and push"
echo ""
echo "When ready, run:"
echo "  git commit -m \"your message\""
echo "  git push origin main"
echo ""
