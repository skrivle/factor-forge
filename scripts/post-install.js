#!/usr/bin/env node

/**
 * Post-install hook for production builds
 * This runs migrations after dependencies are installed during deployment
 */

const isProduction = process.env.NODE_ENV === 'production';
const isVercelBuild = process.env.VERCEL === '1';

// Only run in production builds (Vercel, etc.)
if (!isProduction && !isVercelBuild) {
  console.log('Skipping post-install migrations (not in production build)');
  process.exit(0);
}

// Only run if we have a database URL
if (!process.env.POSTGRES_URL) {
  console.log('⚠️  POSTGRES_URL not set, skipping migrations');
  process.exit(0);
}

console.log('Running post-install migrations...');

async function postInstall() {
  try {
    const { runMigrations } = require('../lib/db/migrations');
    await runMigrations();
    console.log('✅ Post-install migrations complete');
  } catch (error) {
    console.error('❌ Post-install migration failed:', error);
    // Don't fail the build if migrations fail - they can be run manually
    // This prevents deployment failures due to temporary DB issues
    console.log('⚠️  Continuing despite migration failure');
  }
}

postInstall();
