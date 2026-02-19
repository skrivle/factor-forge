#!/bin/bash
# Git History Cleanup Script
# Removes leaked secrets from git history

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧹 GIT HISTORY CLEANUP"
echo "======================"
echo ""
echo -e "${RED}⚠️  WARNING: This will rewrite git history!${NC}"
echo "   - All commit hashes will change"
echo "   - Collaborators will need to re-clone"
echo "   - This requires force pushing"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo -e "${RED}❌ Not a git repository!${NC}"
    exit 1
fi

# Make sure we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo -e "${YELLOW}⚠️  You're on branch '$current_branch', not 'main'${NC}"
    read -p "Continue anyway? (yes/no): " continue_anyway
    if [ "$continue_anyway" != "yes" ]; then
        exit 1
    fi
fi

echo ""
echo "Step 1: Creating backup branch..."
git branch backup-before-cleanup 2>/dev/null || echo "Backup branch already exists"
echo -e "${GREEN}✅ Created backup branch 'backup-before-cleanup'${NC}"

echo ""
echo "Step 2: Creating text file with secrets to remove..."
cat > /tmp/secrets-to-remove.txt << 'EOF'
# Replace database password
***OLD_DB_PASSWORD***===>***REMOVED***

# Replace database connection string
postgresql://***OLD_DB_CONNECTION_STRING***===>postgresql://***REMOVED***

# Replace NextAuth secret
***OLD_NEXTAUTH_SECRET***===>***REMOVED***
EOF

echo -e "${GREEN}✅ Created secrets replacement file${NC}"

echo ""
echo "Step 3: Checking for BFG Repo-Cleaner..."
if command -v bfg &> /dev/null; then
    echo -e "${GREEN}✅ BFG found, using BFG method${NC}"
    USE_BFG=true
else
    echo -e "${YELLOW}⚠️  BFG not found, will use git filter-repo${NC}"
    echo ""
    echo "For better results, install BFG:"
    echo "  brew install bfg  # macOS"
    echo "  Or download from: https://rtyley.github.io/bfg-repo-cleaner/"
    echo ""
    read -p "Continue with git filter-repo? (yes/no): " continue_filter
    if [ "$continue_filter" != "yes" ]; then
        exit 1
    fi
    USE_BFG=false
fi

echo ""
echo "Step 4: Rewriting git history..."

if [ "$USE_BFG" = true ]; then
    # BFG method
    bfg --replace-text /tmp/secrets-to-remove.txt
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
else
    # git filter-branch method
    git filter-branch --force --index-filter \
        'git ls-files -z | xargs -0 -I {} sh -c '\''
            if git show :"{}" | grep -q "***OLD_DB_PASSWORD***\|***OLD_NEXTAUTH_SECRET***"; then
                git rm --cached --ignore-unmatch "{}";
            fi
        '\'' || true' \
        --prune-empty --tag-name-filter cat -- --all
    
    git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
fi

echo -e "${GREEN}✅ History rewritten${NC}"

echo ""
echo "Step 5: Verify secrets are gone..."
if git log --all --full-history --source --all --oneline -S "***OLD_DB_PASSWORD***" | grep -q "***OLD_DB_PASSWORD***"; then
    echo -e "${RED}❌ Secrets still found in history!${NC}"
    echo "You may need to try a different method or contact GitHub support"
else
    echo -e "${GREEN}✅ Secrets appear to be removed from history${NC}"
fi

echo ""
echo -e "${GREEN}✅ Git history cleanup complete!${NC}"
echo ""
echo "FINAL STEP:"
echo "==========="
echo "Force push to GitHub:"
echo ""
echo -e "${RED}  git push origin --force --all${NC}"
echo ""
echo "If you have a backup remote:"
echo "  git push origin --force --tags"
echo ""
echo -e "${YELLOW}⚠️  WARNING: After force pushing:${NC}"
echo "  - Tell collaborators to re-clone the repository"
echo "  - GitHub may still have cached the old commits"
echo "  - Contact GitHub Support to purge the cache: https://support.github.com"
echo ""
echo "Step 6: Cleaning up secrets from helper scripts..."

# Remove secrets from clean-git-history.sh (this file)
sed -i.bak 's/***OLD_DB_PASSWORD***/***OLD_DB_PASSWORD***/g' scripts/clean-git-history.sh
sed -i.bak 's|postgresql://neondb_owner:[^@]*@ep-divine-math-ainzz4yj-pooler.c-4.us-east-1.aws.neon.tech/neondb|postgresql://***OLD_DB_CONNECTION_STRING***|g' scripts/clean-git-history.sh
sed -i.bak 's/***OLD_NEXTAUTH_SECRET***/***OLD_NEXTAUTH_SECRET***/g' scripts/clean-git-history.sh

# Remove secrets from rotate-secrets.sh
sed -i.bak 's/***OLD_DB_PASSWORD***/***OLD_DB_PASSWORD***/g' scripts/rotate-secrets.sh
sed -i.bak 's/***OLD_NEXTAUTH_SECRET***/***OLD_NEXTAUTH_SECRET***/g' scripts/rotate-secrets.sh

# Remove backup files
rm -f scripts/clean-git-history.sh.bak scripts/rotate-secrets.sh.bak

# Commit the sanitized scripts
git add scripts/clean-git-history.sh scripts/rotate-secrets.sh
git commit -m "chore: sanitize helper scripts - remove old leaked secrets" || echo "Nothing to commit"

echo -e "${GREEN}✅ Helper scripts sanitized and committed${NC}"
echo ""

# Cleanup
rm /tmp/secrets-to-remove.txt

echo "Backup created at branch: backup-before-cleanup"
echo "If something goes wrong: git reset --hard backup-before-cleanup"
