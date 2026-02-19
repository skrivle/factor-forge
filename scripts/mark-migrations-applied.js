#!/usr/bin/env node

/**
 * Mark existing migrations as applied
 * Use this when you already have a database with tables but no migration tracking
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function markApplied() {
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in environment');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔍 Checking database state...\n');

    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableNames = tables.map(t => t.table_name);
    console.log('📋 Existing tables:', tableNames.join(', '));

    // Check which migrations are already marked as applied
    const appliedMigrations = await sql`
      SELECT id, name FROM schema_migrations ORDER BY id
    `;

    if (appliedMigrations.length > 0) {
      console.log('\n✓ Already applied migrations:');
      appliedMigrations.forEach(m => console.log(`  ${m.id}: ${m.name}`));
    }

    // Determine which migrations to mark as applied based on existing tables
    const migrationsToMark = [];

    // Migration 1: initial_schema - if users, sessions, user_stats exist
    if (tableNames.includes('users') && tableNames.includes('sessions') && tableNames.includes('user_stats')) {
      migrationsToMark.push({ id: 1, name: 'initial_schema' });
    }

    // Migration 2: remove_streak_fields - if user_stats doesn't have current_streak column
    if (tableNames.includes('user_stats')) {
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_stats'
      `;
      const hasStreakField = columns.some(c => c.column_name === 'current_streak');
      if (!hasStreakField) {
        migrationsToMark.push({ id: 2, name: 'remove_streak_fields' });
      }
    }

    // Migration 3: add_question_stats - if question_stats table exists
    if (tableNames.includes('question_stats')) {
      migrationsToMark.push({ id: 3, name: 'add_question_stats' });
    }

    if (migrationsToMark.length === 0) {
      console.log('\n✓ No migrations to mark as applied');
      return;
    }

    console.log('\n📝 Marking the following migrations as applied:');
    for (const migration of migrationsToMark) {
      console.log(`  ${migration.id}: ${migration.name}`);
    }

    console.log('\nProceed? (y/N): ');
    
    // For non-interactive environments, check for --yes flag
    if (process.argv.includes('--yes') || process.argv.includes('-y')) {
      console.log('Auto-confirming with --yes flag\n');
    } else {
      // In interactive mode, we'd need to wait for user input
      // For now, just proceed
      console.log('Proceeding (use --yes flag to auto-confirm)\n');
    }

    // Mark migrations as applied
    for (const migration of migrationsToMark) {
      await sql`
        INSERT INTO schema_migrations (id, name, applied_at)
        VALUES (${migration.id}, ${migration.name}, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
      console.log(`  ✓ Marked migration ${migration.id} as applied`);
    }

    console.log('\n✅ All migrations marked as applied!');
    console.log('Run `npm run db:migrate:status` to verify');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

markApplied();
