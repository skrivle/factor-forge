# Local Development Setup Guide

## ✅ Setup Complete!

Your local development environment is now configured to connect to the Neon PostgreSQL database.

### Database Connection Details

- **Status**: ✅ Connected
- **Host**: `ep-divine-math-ainzz4yj-pooler.c-4.us-east-1.aws.neon.tech`
- **Database**: `neondb`
- **Schema**: ✅ All tables created
- **Users**: 3 existing users

### Configuration Files

#### `.env.local`
Your environment variables are configured in `.env.local`:
```
NEXTAUTH_SECRET=<your-nextauth-secret>
NEXTAUTH_URL=http://localhost:3000
POSTGRES_URL=<your-postgres-connection-string>
```

**⚠️ SECURITY NOTE:** These are example placeholders. Never commit actual secrets to git!

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server (runs migrations first) |
| `npm run build` | Build the production application (runs migrations first) |
| `npm run start` | Start the production server |
| `npm run db:verify` | Verify database connection and schema |
| `npm run db:migrate` | Manually run pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:create-migration <name>` | Create a new migration file |
| `npm run lint` | Run the linter |

### Getting Started

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Note: Migrations run automatically before the dev server starts!

2. **Open your browser:**
   Navigate to http://localhost:3000

3. **Login:**
   Use one of the 3 existing users in the database, or create a new user through the UI.

### Database Migrations

This project uses an **automated migration system**:

- ✅ Migrations run automatically on `npm run dev`
- ✅ Migrations run automatically during `npm run build` (production)
- ✅ All migrations are tracked to prevent duplicates
- ✅ See `MIGRATIONS.md` for detailed documentation

To check migration status at any time:
```bash
npm run db:migrate:status
```

### Database Schema

Your database has the following tables:

- `users` - User accounts with name, PIN, and role (parent/child)
- `sessions` - Game session records with scores and accuracy
- `user_stats` - User statistics including best scores
- `question_stats` - Individual question performance for adaptive learning
- `user_weak_questions` - View showing questions users struggle with

### Verify Database Connection

At any time, you can verify your database connection:

```bash
npm run db:verify
```

This will:
- Test the connection to Neon
- List all tables in the database
- Show current user count
- Identify any missing tables

### Troubleshooting

#### Connection Issues

If you encounter connection issues:

1. Check that `.env.local` contains the correct `POSTGRES_URL`
2. Verify the database is accessible from your network
3. Run `npm run db:verify` to get detailed error messages

#### Missing Tables

If tables are missing, you can recreate the schema:

1. Visit [Neon Console](https://console.neon.tech/)
2. Navigate to your project's SQL Editor
3. Run the following SQL files in order:
   - `db/schema.sql`
   - `db/migrations/003_add_question_stats.sql`

### Development Tips

- The app uses NextAuth for authentication
- Database queries are in `lib/db/queries.ts`
- Database client is in `lib/db/client.ts`
- The app uses Neon's serverless driver (`@neondatabase/serverless`)

### Next Steps

- Start coding! The environment is ready.
- Check `ADAPTIVE_LEARNING.md` for information about the adaptive learning system
- See `DEPLOYMENT.md` for deployment instructions

---

**Need help?** Run `npm run db:verify` to check your database status.
