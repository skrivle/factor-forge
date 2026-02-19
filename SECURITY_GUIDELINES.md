# Security Guidelines

## 🔐 Preventing Secret Leaks

### Golden Rules

1. **NEVER commit secrets directly in code**
2. **ALWAYS use environment variables**
3. **NEVER commit .env files**
4. **ALWAYS verify before pushing**

### Environment Variables

**✅ DO:**
```typescript
const apiKey = process.env.API_KEY;
const dbUrl = process.env.POSTGRES_URL;
```

**❌ DON'T:**
```typescript
const apiKey = "sk-abc123...";  // NEVER do this
const dbUrl = "postgresql://user:pass@host/db";  // NEVER do this
```

### What Files Should NEVER Be Committed

- `.env`, `.env.local`, `.env.production`
- `credentials.json`, `secrets.yaml`
- Private keys (`.pem`, `.key`, `id_rsa`)
- Database dumps with real data
- API keys or tokens

### Pre-Commit Checks

We have a pre-commit hook that automatically scans for secrets. It will:
- ✅ Block commits containing potential secrets
- ✅ Warn about sensitive file names
- ✅ Prevent common security mistakes

### Manual Security Scan

Run this anytime to scan your codebase:

```bash
./scripts/detect-secrets.sh
```

### If You Accidentally Commit a Secret

1. **IMMEDIATELY rotate the secret** (generate new one, invalidate old)
2. **Update environment variables** everywhere (local, Vercel, etc.)
3. **Clean git history** using the cleanup script
4. **Force push to GitHub**
5. **Verify the secret is gone**

### GitHub Actions

Our repository has automated security scanning that runs on every push and PR:
- Scans for secrets in code
- Checks for sensitive files
- Blocks PRs that contain secrets

### Best Practices

1. **Use placeholder values in documentation:**
   ```bash
   # Good
   POSTGRES_URL=<your-database-url>
   
   # Bad (real value)
   POSTGRES_URL=postgresql://user:actualpassword123@...
   ```

2. **Add comments for sensitive values:**
   ```typescript
   // DO NOT commit this value - use environment variable
   const secret = process.env.NEXTAUTH_SECRET;
   ```

3. **Review diffs before committing:**
   ```bash
   git diff  # Always review your changes
   ```

4. **Use .gitignore properly:**
   - Keep it up to date
   - Add patterns for any new sensitive files
   - Never remove security-critical entries

### Emergency Contacts

If a secret is leaked publicly:
1. Rotate immediately (don't wait)
2. Check GitHub Security Advisories
3. Monitor for unauthorized access
4. Consider contacting GitHub Support to purge cache

### Tools We Use

- **Husky**: Pre-commit hooks
- **GitHub Actions**: Automated security scans
- **Custom scripts**: `detect-secrets.sh` for manual scans

### Regular Maintenance

- [ ] Rotate secrets every 90 days
- [ ] Review access logs monthly
- [ ] Update dependencies for security patches
- [ ] Run security scan before major releases

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App: Config](https://12factor.net/config)
