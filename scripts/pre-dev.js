#!/usr/bin/env node

/**
 * Pre-dev hook - runs before starting the development server
 * This ensures migrations are up to date before the app starts
 */

require('dotenv').config({ path: '.env.local' });

function preDev() {
  console.log('🚀 Pre-dev checks...\n');

  // Check if database URL is configured
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL not found in .env.local');
    console.log('Please configure your database connection before starting the dev server.');
    process.exit(1);
  }

  // Run migrations using Drizzle
  try {
    const { execSync } = require('child_process');
    console.log('🔄 Running Drizzle migrations...');
    execSync('npx tsx scripts/drizzle-migrate.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Migration failed. Please fix the issue before starting the dev server.');
    console.error(error);
    process.exit(1);
  }

  console.log('\n✅ Pre-dev checks complete!\n');
}

preDev();
