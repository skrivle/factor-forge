# Security Setup - Quick Reference

## ✅ What's Been Set Up

### 1. Pre-Commit Hooks (Automatic)
- **Location**: `.husky/pre-commit`
- **What it does**: Automatically scans for secrets before every commit
- **Blocks commits containing**:
  - Database passwords (npg_*)
  - API keys (sk-*, pk-*)
  - AWS keys (AKIA*)
  - Private keys
  - Connection strings with credentials
  - Sensitive files (.env, credentials.json, etc.)

### 2. Manual Security Scanner
- **Command**: `npm run security:scan`
- **Script**: `scripts/detect-secrets.sh`
- **When to use**: Before major releases, when suspicious

### 3. GitHub Actions (Automatic)
- **Location**: `.github/workflows/security-scan.yml`
- **Runs on**: Every push and pull request
- **Blocks**: PRs that contain secrets

### 4. Enhanced .gitignore
- Comprehensive patterns for all secret files
- Prevents accidental commits of:
  - All .env files
  - Credentials files
  - Private keys
  - Secret configuration files

## 📋 Daily Workflow

### Before Committing
1. Review your changes: `git diff`
2. The pre-commit hook will automatically run
3. If it detects secrets, fix them and try again

### If Pre-Commit Hook Blocks You

**Good scenario** (actual secret):
```bash
# 1. Remove the secret from the file
# 2. Use environment variable instead
# 3. Try committing again
```

**False positive** (example in documentation):
```bash
# Only if you're SURE it's safe:
git commit --no-verify

# But better: Exclude that file type in .husky/pre-commit
```

### Manual Security Scan
```bash
# Scan entire codebase
npm run security:scan

# Should output: ✅ No secrets detected in codebase
```

## 🚨 If You Accidentally Commit a Secret

Follow these steps IMMEDIATELY:

1. **Rotate the secret**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   
   # Update .env.local
   # Update Vercel environment variables
   ```

2. **Clean git history**
   ```bash
   ./scripts/clean-git-history.sh
   ```

3. **Force push**
   ```bash
   git push origin --force --all
   ```

## 🛠️ Testing the Security Setup

### Test 1: Try to commit a fake secret
```bash
# Create a test file with a fake secret
echo "const apiKey = 'sk-test123456789012345678901234567890';" > test-secret.js

# Try to commit it
git add test-secret.js
git commit -m "test"

# Expected: ❌ Pre-commit hook should BLOCK this

# Clean up
rm test-secret.js
git reset
```

### Test 2: Try to commit .env file
```bash
# Try to add .env.local
git add .env.local
git commit -m "test"

# Expected: ❌ Pre-commit hook should BLOCK this
```

### Test 3: Run manual scan
```bash
npm run security:scan

# Expected: ✅ No secrets detected in codebase
```

## 📚 Documentation

- **Full security guidelines**: `SECURITY_GUIDELINES.md`
- **Incident response**: See `SECURITY_GUIDELINES.md` → "If You Accidentally Commit a Secret"

## 🔧 Maintenance

### Update Secret Patterns
Edit `.husky/pre-commit` and add new patterns to the `PATTERNS` array:
```bash
PATTERNS=(
  "your_new_pattern_here"
  # existing patterns...
)
```

### Disable Pre-Commit Hook (Emergency Only)
```bash
# Temporary (one commit):
git commit --no-verify

# Permanently (NOT RECOMMENDED):
rm .husky/pre-commit
```

### Update GitHub Actions
Edit `.github/workflows/security-scan.yml` to add more checks

## ✅ Verification Checklist

- [ ] Pre-commit hook runs when you commit
- [ ] `npm run security:scan` completes successfully
- [ ] `.env.local` is in .gitignore
- [ ] `.env.local` is NOT tracked by git
- [ ] GitHub Actions workflow is active

## 🎯 Key Takeaways

1. **Always use environment variables** - Never hardcode secrets
2. **Pre-commit hooks run automatically** - They protect you
3. **Manual scans available** - Run `npm run security:scan` anytime
4. **GitHub Actions backs you up** - Catches what hooks miss
5. **If you leak a secret** - Rotate FIRST, then clean history

## 📞 Emergency Contacts

- **Rotate database password**: Neon dashboard
- **Rotate NextAuth secret**: Generate new with `openssl rand -base64 32`
- **GitHub Support**: For cache purging after history rewrite
