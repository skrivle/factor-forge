# Database Migration System

This project uses **Drizzle ORM** for database migrations, providing a type-safe and automated migration system.

## Overview

Migrations are SQL files managed by Drizzle that run in order to set up and update your database schema. They:
- ✅ Run automatically when you start the dev server (`npm run dev`)
- ✅ Run automatically during production builds (`npm run build`)
- ✅ Track which migrations have been applied using Drizzle's tracking system
- ✅ Are version controlled with your code in the `drizzle/` folder
- ✅ Provide type-safety through the schema definition in `lib/db/schema.ts`

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
npm run db:create-migration
```

This generates a new migration file in the `drizzle/` folder based on changes you've made to `lib/db/schema.ts`.

## How It Works

### Schema Definition

The database schema is defined in TypeScript at `lib/db/schema.ts`. This is the single source of truth for your database structure.

Example:
```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  role: text('role').notNull(),
});
```

### Migration Files

When you change the schema, Drizzle generates migration SQL files in `drizzle/`:

```
drizzle/
├── 0000_add_groups_and_tests.sql
├── 0001_create_default_group.sql
└── meta/
    └── _journal.json  # Drizzle's migration tracking
```

### Automatic Execution

**Development:**
- Migrations run before the dev server starts
- If a migration fails, the server won't start

**Production (Vercel/etc):**
- Migrations run during the build process
- Ensures database is up to date before deployment

### Migration Tracking

Drizzle maintains a `__drizzle_migrations` table to track applied migrations automatically.

## Writing Migrations

### Workflow

1. **Update the Schema**: Edit `lib/db/schema.ts` to add/modify tables or columns

2. **Generate Migration**: Run the migration generator
   ```bash
   npm run db:create-migration
   ```

3. **Review Generated SQL**: Drizzle generates SQL in `drizzle/XXXX_description.sql`

4. **Apply Migration**: Migrations apply automatically on next `npm run dev` or deploy

### Example: Adding a Column

1. Edit `lib/db/schema.ts`:
   ```typescript
   export const users = pgTable('users', {
     id: uuid('id').defaultRandom().primaryKey(),
     name: text('name').notNull(),
     pin: text('pin').notNull(),
     role: text('role').notNull(),
     avatarUrl: text('avatar_url'), // New field
   });
   ```

2. Generate migration:
   ```bash
   npm run db:create-migration
   ```

3. Drizzle creates `drizzle/XXXX_add_avatar_url.sql` with the appropriate SQL

### Example: Creating a New Table

1. Add to `lib/db/schema.ts`:
   ```typescript
   export const achievements = pgTable('achievements', {
     id: uuid('id').defaultRandom().primaryKey(),
     userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
     achievementType: text('achievement_type').notNull(),
     earnedAt: timestamp('earned_at').defaultNow(),
   });
   ```

2. Generate migration:
   ```bash
   npm run db:create-migration
   ```

### Best Practices

1. **Always work through the schema file** - Don't manually edit migration SQL unless absolutely necessary

2. **Review generated migrations** - Check that Drizzle generated the expected SQL

3. **Test locally first**
   ```bash
   npm run db:migrate:status  # Check status
   npm run dev                # Apply and test
   ```

4. **Keep changes focused** - One logical change per migration

5. **Never edit applied migrations** - Create a new migration to make changes

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs migrations, then starts dev server |
| `npm run build` | Runs migrations, then builds for production |
| `npm run db:migrate` | Manually run pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:create-migration <name>` | Create a new migration file |
| `npm run db:verify` | Verify database connection |

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs migrations, then starts dev server |
| `npm run build` | Runs migrations, then builds for production |
| `npm run db:migrate` | Manually run pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:create-migration` | Generate migration from schema changes |
| `npm run db:verify` | Verify database connection |

## Troubleshooting

### Migration Failed Locally

If a migration fails during development:

1. Check the error message in the console
2. If needed, manually fix the database issue
3. Delete the problematic migration from `drizzle/` if it's new
4. Fix your `lib/db/schema.ts`
5. Regenerate the migration
6. Restart the dev server

### Schema and Database Out of Sync

If your database doesn't match your schema:

```bash
# Check what migrations are pending
npm run db:migrate:status

# Apply pending migrations
npm run db:migrate
```

### Need to Rollback Changes

Drizzle doesn't have automatic rollback. Options:

1. **Create a new migration** that reverses the changes (recommended)
2. **Manually run SQL** to undo changes in your database
3. **Reset database** (destructive - only for development)

## Examples

### Example 1: Add a New Column

1. Edit `lib/db/schema.ts`:
   ```typescript
   export const users = pgTable('users', {
     id: uuid('id').defaultRandom().primaryKey(),
     name: text('name').notNull(),
     pin: text('pin').notNull(),
     role: text('role').notNull(),
     email: text('email'), // Add this line
   });
   ```

2. Generate migration:
   ```bash
   npm run db:create-migration
   ```

3. Drizzle creates the migration automatically!

### Example 2: Create a New Table

1. Add to `lib/db/schema.ts`:
   ```typescript
   export const achievements = pgTable('achievements', {
     id: uuid('id').defaultRandom().primaryKey(),
     userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
     achievementType: text('achievement_type').notNull(),
     earnedAt: timestamp('earned_at').defaultNow(),
   });

   export const achievementsRelations = relations(achievements, ({ one }) => ({
     user: one(users, {
       fields: [achievements.userId],
       references: [users.id],
     }),
   }));
   ```

2. Generate migration:
   ```bash
   npm run db:create-migration
   ```

## Production Deployment

### Vercel

Migrations run automatically during build. No extra configuration needed!

The build command in `package.json` already includes migrations:
```json
"build": "npx tsx scripts/drizzle-migrate.ts && next build"
```

Build logs will show migration status.

### Other Platforms

Make sure your build command runs migrations:
```bash
npx tsx scripts/drizzle-migrate.ts && npm run build
```

## Architecture

Drizzle ORM provides a complete type-safe database workflow:

```
1. Define Schema (lib/db/schema.ts)
   ↓
2. Generate Migration (drizzle-kit generate)
   ↓
3. Review SQL (drizzle/XXXX_*.sql)
   ↓
4. Apply Migration (automatic or manual)
   ↓
5. TypeScript types auto-generated from schema
```

## FAQ

**Q: Do I need to run migrations manually?**  
A: No! They run automatically on `npm run dev` and during build.

**Q: Can I edit migration files directly?**  
A: Not recommended. Always update `lib/db/schema.ts` and regenerate migrations.

**Q: What if I need to rollback a migration?**  
A: Create a new migration that reverses the changes. Drizzle doesn't have automatic rollback.

**Q: How do I add seed data?**  
A: Create a manual SQL migration file or use a separate seeding script.

**Q: Where is the migration history stored?**  
A: In the `__drizzle_migrations` table in your database, plus `drizzle/meta/_journal.json` for version control.

---

**Happy migrating! 🚀**
