#!/bin/bash
# Secret Detection Script
# Scans the entire codebase for potential secrets

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 SCANNING CODEBASE FOR SECRETS"
echo "================================="
echo ""

FOUND_ISSUES=0

# Patterns to detect - name:pattern format
check_pattern() {
  local name="$1"
  local pattern="$2"
  
  echo "Checking for: $name"
  
  results=$(grep -rEI "$pattern" . \
    --exclude-dir={node_modules,.git,.next,build,dist,coverage,.husky} \
    --exclude="*.{log,lock}" \
    --exclude="package-lock.json" \
    --exclude="detect-secrets.sh" \
    --exclude="clean-git-history.sh" \
    --exclude="rotate-secrets.sh" \
    --exclude="SECURITY_GUIDELINES.md" \
    --exclude="SECURITY_SETUP.md" \
    --exclude=".env*" \
    2>/dev/null || true)
  
  if [ ! -z "$results" ]; then
    echo -e "${RED}❌ Found potential secrets:${NC}"
    echo "$results"
    echo ""
    FOUND_ISSUES=1
  else
    echo -e "${GREEN}✓ No issues found${NC}"
  fi
  echo ""
}

# Run checks
check_pattern "Database passwords" "npg_[a-zA-Z0-9]+"
check_pattern "AWS Access Keys" "AKIA[0-9A-Z]{16}"
check_pattern "OpenAI API Keys" "sk-[a-zA-Z0-9]{20,}"
check_pattern "Stripe Keys" "(sk_live_|pk_live_|sk_test_|pk_test_)[a-zA-Z0-9]{24,}"
check_pattern "Private Keys" "-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----"
check_pattern "MongoDB URLs with auth" "mongodb://[^/\s]+:[^@\s]+@"
check_pattern "PostgreSQL URLs with auth" "postgresql://[^/\s]+:[^@\s]+@"
check_pattern "MySQL URLs with auth" "mysql://[^/\s]+:[^@\s]+@"

# Check .env files
echo "Checking .env files..."
if [ -f ".env" ] || [ -f ".env.local" ] || [ -f ".env.production" ]; then
  echo -e "${YELLOW}⚠️  .env files found:${NC}"
  ls -la .env* 2>/dev/null || true
  echo ""
  echo "Make sure these are in .gitignore!"
  
  # Check if they're tracked by git
  if git ls-files --error-unmatch .env* 2>/dev/null; then
    echo -e "${RED}❌ ERROR: .env files are tracked by git!${NC}"
    echo "Run: git rm --cached .env*"
    FOUND_ISSUES=1
  else
    echo -e "${GREEN}✓ .env files are not tracked by git${NC}"
  fi
else
  echo -e "${GREEN}✓ No .env files in root directory${NC}"
fi
echo ""

# Summary
echo "================================="
if [ $FOUND_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ No secrets detected in codebase${NC}"
  exit 0
else
  echo -e "${RED}❌ Potential secrets found - please review${NC}"
  exit 1
fi
