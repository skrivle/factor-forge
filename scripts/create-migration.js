#!/usr/bin/env node

/**
 * Create a new migration file
 * Usage: node scripts/create-migration.js migration_name
 * Example: node scripts/create-migration.js add_user_preferences
 */

const fs = require('fs');
const path = require('path');

function createMigration() {
  const migrationName = process.argv[2];

  if (!migrationName) {
    console.error('❌ Migration name is required');
    console.log('Usage: node scripts/create-migration.js migration_name');
    console.log('Example: node scripts/create-migration.js add_user_preferences');
    process.exit(1);
  }

  // Validate migration name (lowercase with underscores)
  if (!/^[a-z][a-z0-9_]*$/.test(migrationName)) {
    console.error('❌ Migration name must be lowercase with underscores (snake_case)');
    console.log('Example: add_user_preferences, remove_old_field');
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');

  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Get the next migration number
  const existingMigrations = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const match = file.match(/^(\d+)_/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => a - b);

  const nextNumber = existingMigrations.length > 0 
    ? existingMigrations[existingMigrations.length - 1] + 1 
    : 1;

  const paddedNumber = nextNumber.toString().padStart(3, '0');
  const fileName = `${paddedNumber}_${migrationName}.sql`;
  const filePath = path.join(migrationsDir, fileName);

  // Create migration file with template
  const template = `-- Migration: ${migrationName.replace(/_/g, ' ')}
-- Created: ${new Date().toISOString()}
-- 
-- Description: Add description of what this migration does
--
-- IMPORTANT: This migration will run automatically on 'npm run dev' and during deployment

-- Add your SQL statements here
-- Example:
-- CREATE TABLE IF NOT EXISTS new_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_new_table_id ON new_table(id);
`;

  fs.writeFileSync(filePath, template);

  console.log('✅ Migration created successfully!');
  console.log(`📝 File: db/migrations/${fileName}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Edit the migration file to add your SQL statements');
  console.log('2. Run `npm run db:migrate:status` to see pending migrations');
  console.log('3. Run `npm run db:migrate` to apply the migration');
  console.log('   (or just start the dev server - migrations run automatically)');
}

createMigration();
