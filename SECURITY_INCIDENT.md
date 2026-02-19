# 🚨 SECURITY INCIDENT RESPONSE

## What Happened

On 2026-02-19, the following secrets were accidentally committed to `DEV_SETUP.md` and pushed to GitHub:

1. **Database Connection String** (POSTGRES_URL)
   - Contains username, password, and host information
   - Allows full access to the Neon PostgreSQL database

2. **NextAuth Secret** (NEXTAUTH_SECRET)
   - Used for session token encryption
   - Could allow session hijacking if not rotated

## Immediate Actions Taken

- ✅ Removed secrets from `DEV_SETUP.md`
- ✅ Created rotation scripts

## Required Actions (IN ORDER)

### 1. Rotate Secrets (CRITICAL - Do First!)

Run the rotation script:

```bash
chmod +x scripts/rotate-secrets.sh
./scripts/rotate-secrets.sh
```

This will:
- Generate a new NEXTAUTH_SECRET
- Guide you through rotating database credentials
- Verify the new credentials work

**Manual Steps:**

#### A. Rotate Database (Neon)
1. Go to [Neon Console](https://console.neon.tech/)
2. Navigate to your project
3. Go to Settings → Reset Password
4. Copy the new connection string
5. Update `.env.local` with new `POSTGRES_URL`
6. Update Vercel: `vercel env add POSTGRES_URL`

#### B. Rotate NextAuth Secret
1. Generate new secret: `openssl rand -base64 32`
2. Update `.env.local` with new `NEXTAUTH_SECRET`
3. Update Vercel: `vercel env add NEXTAUTH_SECRET`

### 2. Clean Git History

After rotating secrets, remove them from git history:

```bash
chmod +x scripts/clean-git-history.sh
./scripts/clean-git-history.sh
```

This will:
- Create a backup branch
- Rewrite git history to remove secrets
- Clean up refs and garbage collect

### 3. Force Push

```bash
git push origin --force --all
git push origin --force --tags
```

⚠️ **WARNING**: This changes all commit hashes. Notify collaborators to re-clone!

### 4. Contact GitHub Support

Even after force pushing, GitHub may cache old commits. Contact GitHub Support to purge:

1. Go to: https://support.github.com/contact
2. Select: "Report a security issue"
3. Explain that secrets were committed and you've force-pushed
4. Request cache purge for commit: `15f4a545fde4a25bd56fd60ce99d3585a3ab6a19`

### 5. Monitor for Unauthorized Access

#### Check Neon Dashboard:
- Review connection logs
- Check for suspicious queries
- Consider enabling IP allowlist

#### Check Vercel Logs:
- Look for unusual deployments
- Review function invocation patterns

## Prevention for Future

### Added to .gitignore:
Already present:
```
.env*.local
.env
```

### Best Practices:
1. ✅ Never commit real secrets to documentation files
2. ✅ Use placeholders: `<your-secret-here>`
3. ✅ Use environment variables for all secrets
4. ✅ Enable pre-commit hooks to scan for secrets
5. ✅ Regular security audits of documentation

### Consider Installing:
```bash
# Git-secrets to prevent committing secrets
brew install git-secrets
git secrets --install
git secrets --register-aws
```

## Verification Checklist

After completing all steps:

- [ ] New NEXTAUTH_SECRET generated and deployed
- [ ] Database password rotated
- [ ] New POSTGRES_URL updated in .env.local
- [ ] New POSTGRES_URL updated in Vercel
- [ ] Local app runs with new credentials
- [ ] Git history cleaned and force-pushed
- [ ] GitHub support contacted for cache purge
- [ ] No unauthorized database access detected
- [ ] Collaborators notified (if any)

## Timeline

- **2026-02-19 20:02**: Secrets committed in commit `15f4a54`
- **2026-02-19 ~20:15**: Pushed to GitHub
- **2026-02-19 ~20:xx**: GitHub security alert received
- **2026-02-19 ~20:xx**: Response initiated
- **2026-02-19 ~20:xx**: Secrets removed from file
- **[PENDING]**: Secrets rotated
- **[PENDING]**: Git history cleaned
- **[PENDING]**: Force pushed
- **[PENDING]**: GitHub cache purged

## Status

🔴 **CRITICAL - ACTION REQUIRED**

Secrets have been exposed and must be rotated immediately.

---

Last Updated: 2026-02-19
