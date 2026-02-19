# Database Migration System

This project uses an automated database migration system that runs automatically on startup (both dev and production).

## Overview

Migrations are SQL files that run in order to set up and update your database schema. They:
- ✅ Run automatically when you start the dev server (`npm run dev`)
- ✅ Run automatically during production builds (`npm run build`)
- ✅ Track which migrations have been applied to prevent duplicates
- ✅ Are version controlled with your code

## Quick Start

### View Migration Status

```bash
npm run db:migrate:status
```

This shows which migrations have been applied and which are pending.

### Run Migrations Manually

```bash
npm run db:migrate
```

Usually you don't need to do this - migrations run automatically!

### Create a New Migration

```bash
npm run db:create-migration add_feature_name
```

Example:
```bash
npm run db:create-migration add_user_preferences
```

This creates a new file like `db/migrations/004_add_user_preferences.sql`.

## How It Works

### Migration Files

Migrations are numbered SQL files in `db/migrations/`:

```
db/migrations/
├── 001_initial_schema.sql
├── 002_remove_streak_fields.sql
└── 003_add_question_stats.sql
```

### Automatic Execution

**Development:**
- Migrations run before the dev server starts
- If a migration fails, the server won't start

**Production (Vercel/etc):**
- Migrations run during the build process
- If migrations fail, the build continues (to prevent deployment failures from temporary DB issues)
- You can also trigger migrations via the API endpoint `/api/migrate`

### Migration Tracking

The system uses a `schema_migrations` table to track which migrations have been applied:

```sql
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);
```

## Writing Migrations

### Create a Migration

```bash
npm run db:create-migration my_migration_name
```

### Edit the Migration File

Open `db/migrations/XXX_my_migration_name.sql` and add your SQL:

```sql
-- Migration: my_migration_name
-- Created: 2026-02-19

-- Add a new column
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Create a new table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create an index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON user_preferences(user_id);
```

### Best Practices

1. **Use IF EXISTS / IF NOT EXISTS**
   ```sql
   CREATE TABLE IF NOT EXISTS my_table (...);
   ALTER TABLE my_table DROP COLUMN IF EXISTS old_column;
   ```

2. **Add indexes for foreign keys**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_table_user_id ON table(user_id);
   ```

3. **Keep migrations small and focused**
   - One migration per feature/change
   - Easier to debug and roll back if needed

4. **Test migrations locally first**
   ```bash
   npm run db:migrate:status  # Check status
   npm run db:migrate         # Run pending migrations
   ```

5. **Never edit applied migrations**
   - Once a migration is applied (especially in production), create a new migration to make changes
   - Editing applied migrations will cause inconsistencies

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs migrations, then starts dev server |
| `npm run build` | Runs migrations, then builds for production |
| `npm run db:migrate` | Manually run pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:create-migration <name>` | Create a new migration file |
| `npm run db:verify` | Verify database connection |

## Migration API Endpoint

You can also trigger migrations via HTTP (useful for production):

### Check Status

```bash
curl https://your-app.vercel.app/api/migrate?status=true
```

### Run Migrations

```bash
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET"
```

**Security:** In production, the API requires a secret token. Set `MIGRATION_SECRET` in your environment variables.

## Troubleshooting

### Migration Failed Locally

If a migration fails during development:

1. Fix the SQL in the migration file
2. Restart the dev server (migrations will retry)

### Migration Tracking Is Wrong

If you already have tables but migrations show as pending:

```bash
node scripts/mark-migrations-applied.js --yes
```

This marks existing migrations as applied without running them.

### Reset All Migrations (Destructive!)

⚠️ **This deletes all data!**

```sql
-- In your database SQL editor
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS question_stats CASCADE;
```

Then restart your dev server to run all migrations from scratch.

### Check What Will Be Applied

```bash
npm run db:migrate:status
```

This shows pending migrations without running them.

### Migration Failed in Production

1. Check the Vercel build logs for migration errors
2. Fix the migration SQL
3. Push the fix
4. Or trigger migrations manually via API:
   ```bash
   curl -X POST https://your-app.vercel.app/api/migrate \
     -H "Authorization: Bearer $MIGRATION_SECRET"
   ```

## Examples

### Example 1: Add a New Column

```bash
npm run db:create-migration add_email_to_users
```

Edit `db/migrations/004_add_email_to_users.sql`:
```sql
-- Add email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
```

### Example 2: Create a New Table

```bash
npm run db:create-migration create_achievements_table
```

Edit `db/migrations/005_create_achievements_table.sql`:
```sql
-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id 
  ON achievements(user_id);
```

### Example 3: Rename a Column

```bash
npm run db:create-migration rename_accuracy_to_accuracy_rate
```

Edit `db/migrations/006_rename_accuracy_to_accuracy_rate.sql`:
```sql
-- Rename accuracy column to accuracy_rate
ALTER TABLE sessions 
  RENAME COLUMN accuracy TO accuracy_rate;
```

### Example 4: Add a Computed Column

```bash
npm run db:create-migration add_score_ranking_view
```

Edit `db/migrations/007_add_score_ranking_view.sql`:
```sql
-- Create a view for score rankings
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
  u.id,
  u.name,
  us.best_score,
  RANK() OVER (ORDER BY us.best_score DESC) as rank
FROM users u
JOIN user_stats us ON u.id = us.user_id
ORDER BY rank;
```

## Production Deployment

### Vercel

Migrations run automatically during build. No extra configuration needed!

The build command in `package.json` already includes migrations:
```json
"build": "node scripts/migrate.js up && next build"
```

### Other Platforms

Make sure your build command runs migrations:
```bash
node scripts/migrate.js up && npm run build
```

Or use the post-install hook (already configured in `scripts/post-install.js`).

## Architecture

```
┌─────────────────┐
│   npm run dev   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ scripts/        │
│ pre-dev.js      │◄── Loads .env.local
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ lib/db/         │
│ migrations.js   │◄── Migration logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check           │
│ schema_         │◄── Tracking table
│ migrations      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run pending     │
│ migrations from │◄── SQL files
│ db/migrations/  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Next.js dev     │
│ server starts   │
└─────────────────┘
```

## FAQ

**Q: Do I need to run migrations manually?**  
A: No! They run automatically on `npm run dev` and during build.

**Q: Can I run migrations in parallel?**  
A: No, migrations run sequentially in numerical order to maintain consistency.

**Q: What if I need to rollback a migration?**  
A: Create a new migration that reverses the changes. Never edit applied migrations.

**Q: How do I add seed data?**  
A: Create a migration with INSERT statements. Use `ON CONFLICT DO NOTHING` to make it idempotent.

**Q: Can migrations fail?**  
A: Yes. In development, the server won't start. In production, builds continue but you should fix and redeploy.

**Q: Where is the migration history stored?**  
A: In the `schema_migrations` table in your database.

**Q: Can I skip a migration?**  
A: Not recommended. If needed, you can manually insert a row into `schema_migrations`.

---

**Happy migrating! 🚀**
