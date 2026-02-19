#!/bin/bash
# Security Incident Response Script
# This script helps rotate secrets after they've been leaked to git

set -e

echo "🚨 SECRET ROTATION SCRIPT"
echo "=========================="
echo ""
echo "This script will help you rotate the leaked secrets."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  CRITICAL: Do these steps in order!${NC}"
echo ""

# Step 1: Generate new NextAuth secret
echo "STEP 1: Generate New NextAuth Secret"
echo "======================================"
NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo ""
echo -e "${GREEN}✅ Generated new NEXTAUTH_SECRET:${NC}"
echo "$NEW_NEXTAUTH_SECRET"
echo ""
echo "Copy this value and:"
echo "  1. Update your local .env.local file"
echo "  2. Update Vercel environment variables:"
echo "     vercel env add NEXTAUTH_SECRET"
echo ""
read -p "Press ENTER when you've updated NEXTAUTH_SECRET..."

# Step 2: Database credentials
echo ""
echo "STEP 2: Rotate Database Credentials"
echo "===================================="
echo ""
echo "Go to your database provider (Neon/Vercel Postgres) and:"
echo "  1. Reset/rotate the database password"
echo "  2. Copy the new connection string"
echo "  3. Update your local .env.local file with POSTGRES_URL=<new-value>"
echo "  4. Update Vercel environment variables:"
echo "     vercel env add POSTGRES_URL"
echo ""
read -p "Press ENTER when you've rotated database credentials..."

# Step 3: Verify secrets are updated locally
echo ""
echo "STEP 3: Verify Local Environment"
echo "================================="
echo ""
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    exit 1
fi

if grep -q "***OLD_DB_PASSWORD***" .env.local 2>/dev/null; then
    echo -e "${RED}❌ OLD DATABASE PASSWORD STILL IN .env.local!${NC}"
    echo "Please update .env.local with the new POSTGRES_URL"
    exit 1
fi

if grep -q "***OLD_NEXTAUTH_SECRET***" .env.local 2>/dev/null; then
    echo -e "${RED}❌ OLD NEXTAUTH_SECRET STILL IN .env.local!${NC}"
    echo "Please update .env.local with the new NEXTAUTH_SECRET"
    exit 1
fi

echo -e "${GREEN}✅ Local environment looks good${NC}"

# Step 4: Test connection
echo ""
echo "STEP 4: Test New Database Connection"
echo "====================================="
echo ""
echo "Testing database connection..."
if npm run db:verify 2>&1 | grep -q "Connection successful"; then
    echo -e "${GREEN}✅ Database connection works!${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify database connection${NC}"
    echo "Make sure the new POSTGRES_URL is correct"
fi

echo ""
echo -e "${GREEN}✅ Secret rotation complete!${NC}"
echo ""
echo "NEXT STEPS:"
echo "==========="
echo "1. Run: ./scripts/clean-git-history.sh"
echo "2. Force push to remove secrets from GitHub"
echo ""
