#!/usr/bin/env node

/**
 * Pre-dev hook - runs before starting the development server
 * This ensures migrations are up to date before the app starts
 */

require('dotenv').config({ path: '.env.local' });

async function preDev() {
  console.log('🚀 Pre-dev checks...\n');

  // Check if database URL is configured
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL not found in .env.local');
    console.log('Please configure your database connection before starting the dev server.');
    process.exit(1);
  }

  // Run migrations
  try {
    const { runMigrations } = require('../lib/db/migrations');
    await runMigrations();
    console.log('');
  } catch (error) {
    console.error('❌ Migration failed. Please fix the issue before starting the dev server.');
    console.error(error);
    process.exit(1);
  }

  console.log('✅ Pre-dev checks complete!\n');
}

preDev();
