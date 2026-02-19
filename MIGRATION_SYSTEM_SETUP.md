# Migration System Setup - Complete ✅

## Summary

Your project now has a fully automated database migration system that:

✅ **Runs automatically on `npm run dev`** - Migrations check and apply before dev server starts  
✅ **Runs automatically on `npm run build`** - Migrations apply during production builds  
✅ **Tracks applied migrations** - Prevents duplicate runs using `schema_migrations` table  
✅ **Easy to use** - Simple commands to create, check, and run migrations  
✅ **Production ready** - Works seamlessly with Vercel and other platforms  

## What Was Created

### Core Files

1. **`lib/db/migrations.js`**
   - Main migration logic (CommonJS for script compatibility)
   - Handles tracking, running, and status checking

2. **`scripts/migrate.js`**
   - CLI tool for running migrations
   - Usage: `node scripts/migrate.js [up|status]`

3. **`scripts/pre-dev.js`**
   - Pre-dev hook that runs before `npm run dev`
   - Checks database connection and runs migrations

4. **`scripts/post-install.js`**
   - Post-install hook for production builds
   - Runs migrations during deployment (Vercel, etc.)

5. **`scripts/create-migration.js`**
   - Tool for creating new migration files
   - Generates numbered SQL files with templates

6. **`scripts/mark-migrations-applied.js`**
   - Utility to mark existing migrations as applied
   - Useful when setting up migration tracking on existing database

7. **`app/api/migrate/route.ts`**
   - API endpoint for triggering migrations via HTTP
   - Protected by `MIGRATION_SECRET` in production

### Migration Files

Created migration files in `db/migrations/`:

- `001_initial_schema.sql` - Base tables (users, sessions, user_stats)
- `002_remove_streak_fields.sql` - Remove deprecated streak columns
- `003_add_question_stats.sql` - Add question tracking for adaptive learning

All three migrations are already marked as **applied** ✅

### Documentation

- **`MIGRATIONS.md`** - Complete migration system documentation
  - How migrations work
  - Writing migrations guide
  - Best practices
  - Troubleshooting
  - Examples

- **`DEV_SETUP.md`** - Updated with migration commands
- **`DEPLOYMENT.md`** - Updated with production migration info

### Package.json Scripts

Added new commands:

```json
{
  "dev": "node scripts/pre-dev.js && next dev",
  "build": "node scripts/migrate.js up && next build",
  "db:migrate": "node scripts/migrate.js up",
  "db:migrate:status": "node scripts/migrate.js status",
  "db:create-migration": "node scripts/create-migration.js"
}
```

## How It Works

### Development Workflow

```bash
# 1. Start dev server (migrations run automatically)
npm run dev

# Output:
# 🚀 Pre-dev checks...
# 🔄 Starting database migrations...
# ✓ All migrations are up to date
# ✅ Pre-dev checks complete!
# ▲ Next.js 16.1.6
# - Local: http://localhost:3000
```

### Production Workflow

```bash
# On Vercel/production build
npm run build

# Output:
# 🔄 Starting database migrations...
# ✓ All migrations are up to date
# Building Next.js...
```

### Migration Tracking

The system creates a `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);
```

Current status:
```
ID  | Status   | Name
----+----------+---------------------------
  1 | ✓ Applied | initial_schema
  2 | ✓ Applied | remove_streak_fields
  3 | ✓ Applied | add_question_stats
```

## Usage Examples

### Check Migration Status

```bash
npm run db:migrate:status
```

### Create a New Migration

```bash
npm run db:create-migration add_user_avatar
```

This creates `db/migrations/004_add_user_avatar.sql`.

Edit the file:
```sql
-- Migration: add_user_avatar
-- Add avatar URL column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### Run Migrations Manually

```bash
npm run db:migrate
```

(Usually not needed - they run automatically!)

### Production: Trigger Migrations via API

```bash
# Check status
curl https://your-app.vercel.app/api/migrate?status=true

# Run migrations (requires MIGRATION_SECRET)
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer your-secret-token"
```

## Key Features

### 1. Automatic Execution

- **Dev**: Migrations run before server starts
- **Build**: Migrations run during build process
- **No manual intervention needed!**

### 2. Safety

- Idempotent migrations using `IF EXISTS` / `IF NOT EXISTS`
- Tracking prevents duplicate runs
- Failed migrations stop dev server (preventing broken state)
- Production builds continue even if migrations fail (prevents deployment lock)

### 3. Developer Experience

- Simple commands
- Clear status output
- Template generation for new migrations
- Comprehensive error messages

### 4. Production Ready

- Works with Vercel out of the box
- API endpoint for manual triggers
- Environment-based configuration
- Secure with token authentication

## Testing

The system has been tested and verified:

✅ Migration tracking table created  
✅ Existing migrations marked as applied  
✅ Status command shows correct state  
✅ Pre-dev hook runs successfully  
✅ Dev server starts with migrations  
✅ API endpoint created and ready  

## Next Steps

### For Immediate Use

1. **Development**: Just run `npm run dev` - migrations happen automatically
2. **Creating migrations**: Use `npm run db:create-migration <name>` when you need to change the schema
3. **Checking status**: Use `npm run db:migrate:status` anytime

### For Production Deployment

1. **Vercel**: Migrations run automatically during build - nothing to configure!
2. **Other platforms**: Build command already includes migrations
3. **Optional**: Set `MIGRATION_SECRET` environment variable for secure API access

### Documentation

Read these files for more info:

- **`MIGRATIONS.md`** - Complete guide to the migration system
- **`DEV_SETUP.md`** - Local development setup
- **`DEPLOYMENT.md`** - Production deployment guide

## Common Commands

```bash
# Development
npm run dev                          # Start with migrations
npm run db:migrate:status            # Check status

# Creating Migrations
npm run db:create-migration <name>   # Create new migration

# Manual Operations
npm run db:migrate                   # Run pending migrations
npm run db:verify                    # Verify database connection

# Production
npm run build                        # Build with migrations
```

## Troubleshooting

### "Migration failed" on dev start

The migration has a SQL error. Check the error message, fix the SQL in the migration file, and restart.

### "All migrations are pending" but tables exist

Run: `node scripts/mark-migrations-applied.js --yes`

### Migration stuck in pending state

Check the `schema_migrations` table to see what's been applied. You can manually insert records if needed.

### Need to rollback

Create a new migration that reverses the changes. Never edit applied migrations!

## Files Overview

```
math-app/
├── lib/db/
│   └── migrations.js                    # Core migration logic
├── scripts/
│   ├── migrate.js                       # CLI runner
│   ├── pre-dev.js                       # Pre-dev hook
│   ├── post-install.js                  # Build-time hook
│   ├── create-migration.js              # Migration generator
│   └── mark-migrations-applied.js       # Setup utility
├── db/migrations/
│   ├── 001_initial_schema.sql           # Base schema
│   ├── 002_remove_streak_fields.sql     # Cleanup
│   └── 003_add_question_stats.sql       # Features
├── app/api/migrate/
│   └── route.ts                         # API endpoint
├── MIGRATIONS.md                         # Full documentation
├── DEV_SETUP.md                          # Dev guide (updated)
└── DEPLOYMENT.md                         # Deploy guide (updated)
```

## Summary

You now have a **production-ready, automated migration system** that:

- Runs automatically on startup (dev and prod)
- Tracks applied migrations
- Makes schema changes easy and safe
- Works seamlessly with your deployment platform
- Includes comprehensive documentation

**No manual migration management needed - just create migration files when you need to change the schema, and the system handles the rest!** 🚀

---

**Questions?** See `MIGRATIONS.md` for detailed documentation.
