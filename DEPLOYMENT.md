# Factor Forge - Deployment Guide

## Quick Deploy to Vercel

### Option 1: One-Click Deploy (Easiest)

1. **Fork this repository to your GitHub account**

2. **Click the Deploy button** (if available) or follow Option 2

### Option 2: Manual Vercel Deployment

#### Step 1: Set Up Database (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project (name it "factor-forge")
3. Once created, go to **Dashboard** → **Connection Details**
4. Copy the connection string (it looks like: `postgresql://user:pass@host/dbname`)

#### Step 2: Set Up Database

**Automatic Setup (Recommended):**

Migrations run automatically during Vercel deployment! Just deploy and the database will be set up.

**Manual Verification (Optional):**

1. In Neon Console, click **SQL Editor**
2. Run a simple query to verify:
   ```sql
   SELECT * FROM users LIMIT 1;
   ```

After your first deployment, migrations will have created all tables automatically.

#### Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 4: Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
NEXTAUTH_SECRET=<generate-with-command-below>
NEXTAUTH_URL=https://your-app.vercel.app

# From Neon connection string
POSTGRES_URL=<your-neon-connection-string>
POSTGRES_PRISMA_URL=<your-neon-connection-string>?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=<your-neon-connection-string>
POSTGRES_USER=<from-neon>
POSTGRES_HOST=<from-neon>
POSTGRES_PASSWORD=<from-neon>
POSTGRES_DATABASE=<from-neon>
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

#### Step 5: Deploy

1. Click **Deploy**
2. Wait for build to complete (migrations will run automatically during build!)
3. Visit your app URL
4. Sign in with sample users:
   - Dad (PIN: 1234)
   - Mom (PIN: 5678)
   - Alice (PIN: 1111)
   - Bob (PIN: 2222)

**Note:** The build process includes automatic database migrations via Drizzle ORM. Check the build logs to see migration status.

## Alternative: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXTAUTH_SECRET
vercel env add POSTGRES_URL
# ... add all other env vars

# Deploy to production
vercel --prod
```

## Post-Deployment

### Database Migrations

This project uses **Drizzle ORM** with an automated migration system:

- ✅ Migrations run automatically during Vercel builds
- ✅ Schema is defined in `lib/db/schema.ts`
- ✅ Migration files are in `drizzle/` folder
- ✅ See `MIGRATIONS.md` for complete documentation

**Verify migrations ran successfully:**

Check your Vercel deployment logs for migration output. You should see:
```
Running database migrations...
✓ Migrations applied successfully
```

### Custom Domain

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` in environment variables
4. Redeploy

### Create New Users

#### Option A: Via Database

1. Go to Neon SQL Editor
2. Run:
```sql
INSERT INTO users (name, pin, role)
VALUES ('NewUser', '9999', 'child');

INSERT INTO user_stats (user_id)
SELECT id FROM users WHERE name = 'NewUser';
```

#### Option B: Build User Registration (Future Enhancement)

See README.md for planned features.

## Security Recommendations

### For Family Use (Private Network)
- ✅ **PIN hashing enabled by default** - All PINs are automatically hashed using bcrypt
- Use a strong `NEXTAUTH_SECRET`
- Don't expose publicly without additional security

### For Public/Shared Hosting
1. ✅ **PINs are hashed** - Already implemented with bcrypt
2. **Add Rate Limiting**: Use Vercel's rate limiting or Upstash
3. **Add CAPTCHA**: For sign-in page
4. **Use Email Verification**: For new user registration

### PIN Hashing (✅ Already Implemented)

The app automatically hashes PINs using bcryptjs:
- New users: PINs are hashed on creation
- Existing users: PINs are hashed during migration (runs automatically)
- The migration is idempotent - it won't re-hash already hashed PINs

No additional configuration needed. The system handles everything automatically.

## Monitoring

### Vercel Analytics

1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. View real-time performance data

### Database Monitoring (Neon)

1. Go to Neon Dashboard
2. View:
   - Connection count
   - Query performance
   - Storage usage

## Troubleshooting

### Build Fails

**Issue**: TypeScript errors
- Run `npm run build` locally
- Fix any type errors
- Push and redeploy

**Issue**: Missing environment variables
- Check Vercel logs
- Ensure all env vars are set
- Redeploy after adding vars

### Database Connection Fails

**Issue**: "connection refused"
- Check if Neon database is active
- Verify connection string
- Check if IP is whitelisted (Neon allows all by default)

**Issue**: "SSL required"
- Add `?sslmode=require` to connection string

### Authentication Issues

**Issue**: Can't sign in
- Clear browser cookies
- Check if users exist in database
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain

### Performance Issues

**Issue**: Slow page loads
- Enable Vercel Analytics
- Check database query performance in Neon
- Add database indexes (already included in schema)

**Issue**: Database connection limit
- Use Neon's connection pooling
- Ensure `POSTGRES_PRISMA_URL` has `?pgbouncer=true`

## Backup & Restore

### Backup Database

**Using Neon:**
1. Go to Neon Dashboard
2. Click **Branches** → **Create Branch**
3. This creates a point-in-time backup

**Manual Export:**
```bash
pg_dump $POSTGRES_URL > backup.sql
```

### Restore Database

```bash
psql $POSTGRES_URL < backup.sql
```

## Scaling

### If You Outgrow Free Tier

**Neon Free Tier Limits:**
- 10 GB storage
- 100 hours compute/month

**Upgrade Path:**
1. Neon Pro Plan ($19/mo)
2. Or migrate to:
   - Supabase
   - Railway
   - Your own PostgreSQL server

### Code Optimizations for Scale

1. **Add Caching**: Use Redis for leaderboard
2. **Optimize Queries**: Add materialized views
3. **CDN Assets**: Use Vercel Edge Network
4. **API Rate Limiting**: Prevent abuse

## Cost Estimate

### Free Tier (Sufficient for Family Use)
- **Vercel**: Free (Hobby plan)
- **Neon**: Free (up to 10GB)
- **Total**: $0/month ✅

### Paid (for larger families/schools)
- **Vercel Pro**: $20/month
- **Neon Pro**: $19/month
- **Total**: $39/month

## Support

For issues:
1. Check this guide
2. Review README.md
3. Check Vercel deployment logs
4. Check Neon database logs
5. Open an issue on GitHub

---

**🎉 Enjoy Factor Forge!**
