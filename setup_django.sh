#!/bin/bash

# Django Setup Script for ZhonyaS
# This script initializes Django, creates migrations, and applies them

set -e  # Exit on error

echo "================================================"
echo "  ZhonyaS Django Setup"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Warning: Virtual environment not activated${NC}"
    echo "Please activate it with: source .venv/bin/activate"
    exit 1
fi

# 1. Install/Update dependencies
echo -e "${BLUE}[1/4] Installing/Updating Python dependencies...${NC}"
pip install --upgrade pip setuptools wheel
pip install -r setup/requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# 2. Create Django migrations
echo -e "${BLUE}[2/4] Creating Django migrations...${NC}"
python manage.py makemigrations Entity
echo -e "${GREEN}✓ Migrations created${NC}\n"

# 3. Show pending migrations
echo -e "${BLUE}[3/4] Showing migration status...${NC}"
python manage.py showmigrations Entity
echo -e "${GREEN}✓ Migration status displayed${NC}\n"

# 4. Apply migrations
echo -e "${BLUE}[4/4] Applying migrations to database...${NC}"
python manage.py migrate Entity
echo -e "${GREEN}✓ Migrations applied${NC}\n"

echo "================================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "  - Start MariaDB: docker-compose -f setup/docker-compose.yml up -d"
echo "  - Run backend: cd backend && python app.py"
echo "  - Run frontend: cd frontend && npm run dev"
echo ""
