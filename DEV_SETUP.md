# Local Development Setup Guide

## Prerequisites

- Node.js 20+ installed
- npm or yarn
- PostgreSQL database (recommended: Neon)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
POSTGRES_URL=your-postgres-connection-string
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Get POSTGRES_URL:**
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string

⚠️ **SECURITY NOTE:** Never commit `.env.local` to git!

### 3. Set Up Database

The project uses **Drizzle ORM** with automated migrations.

#### Automatic Setup (Recommended)

Just start the dev server - migrations run automatically:

```bash
npm run dev
```

Migrations will:
- Create all required tables
- Set up indexes and relationships
- Track applied migrations

#### Manual Migration (if needed)

```bash
npm run db:migrate
```

### 4. Verify Database Connection

```bash
npm run db:verify
```

This checks:
- Database connection is working
- All required tables exist
- Shows current user count

### 5. Create Users

#### Option A: Manual SQL Insert

Connect to your database and run:

```sql
-- Create users
INSERT INTO users (name, pin, role)
VALUES 
  ('Dad', '1234', 'parent'),
  ('Mom', '5678', 'parent'),
  ('Alice', '1111', 'child'),
  ('Bob', '2222', 'child');

-- Create user stats records
INSERT INTO user_stats (user_id)
SELECT id FROM users;
```

#### Option B: Use Database Console

1. Go to your Neon Console
2. Open SQL Editor
3. Run the SQL above

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in!

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (runs migrations first) |
| `npm run build` | Build for production (runs migrations first) |
| `npm run start` | Start production server |
| `npm run db:verify` | Verify database connection |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:create-migration` | Generate migration from schema changes |
| `npm run lint` | Run the linter |

## Database Information

### Schema Definition

The database schema is defined in TypeScript at `lib/db/schema.ts` using Drizzle ORM.

### Tables

- `users` - User accounts with name, PIN, and role
- `groups` - User groups for organizing family members
- `sessions` - Game session records with scores
- `user_stats` - User statistics and achievements
- `question_stats` - Question-level performance tracking
- `tests` - Saved test configurations
- `test_attempts` - Test attempt records

### Migrations

Migrations are in the `drizzle/` folder and managed by Drizzle Kit. See `MIGRATIONS.md` for details.

## Development Workflow

### Making Schema Changes

1. Edit `lib/db/schema.ts`
2. Generate migration: `npm run db:create-migration`
3. Review generated SQL in `drizzle/`
4. Restart dev server (migration applies automatically)

### Checking Migration Status

```bash
npm run db:migrate:status
```

## Troubleshooting

### Connection Issues

If you encounter database connection issues:

1. Check `.env.local` has correct `POSTGRES_URL`
2. Verify database is accessible
3. Run `npm run db:verify` for detailed diagnostics

### Migration Issues

If migrations fail:

1. Check error message in console
2. Verify database connection
3. Check `drizzle/` folder for migration files
4. See `MIGRATIONS.md` for detailed troubleshooting

### TypeScript Errors

If you see type errors:

```bash
npm run lint
```

Fix any errors and restart the dev server.

### Port Already in Use

If port 3000 is busy:

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

## Project Structure

```
math-app/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── game/            # Game pages
│   └── ...
├── components/          # React components
├── lib/
│   ├── db/
│   │   ├── schema.ts    # Drizzle schema definition
│   │   ├── client.ts    # Database client
│   │   └── queries.ts   # Database queries
│   └── game/            # Game logic
├── drizzle/             # Migration files
│   ├── 0000_*.sql
│   └── meta/
├── .env.local          # Environment variables (gitignored)
└── drizzle.config.ts   # Drizzle configuration
```

## Development Tips

- Database queries use Drizzle ORM for type safety
- Schema changes require migration generation
- Hot reload works for most changes
- Check browser console for client-side errors
- Check terminal for server-side errors

## Next Steps

- Explore the codebase
- Read `MIGRATIONS.md` for database changes
- Check `ADAPTIVE_LEARNING.md` for AI features
- See `DEPLOYMENT.md` for production deployment

---

**Need help?** Run `npm run db:verify` to check your setup.
