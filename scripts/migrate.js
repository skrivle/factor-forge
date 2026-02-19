#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script runs pending database migrations.
 * Usage: node scripts/migrate.js [command]
 * 
 * Commands:
 *   up       - Run all pending migrations (default)
 *   status   - Show migration status
 */

require('dotenv').config({ path: '.env.local' });

async function main() {
  const command = process.argv[2] || 'up';

  // Dynamic import since we're using ES modules in the lib
  const { runMigrations, showMigrationStatus } = require('../lib/db/migrations');

  if (command === 'status') {
    await showMigrationStatus();
  } else if (command === 'up') {
    await runMigrations();
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('Usage: node scripts/migrate.js [up|status]');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
