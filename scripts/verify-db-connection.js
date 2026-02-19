#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * 
 * This script verifies the database connection and checks if the schema is set up correctly.
 * Run with: node scripts/verify-db-connection.js
 */

const { neon } = require('@neondatabase/serverless');

async function verifyConnection() {
  console.log('🔍 Verifying database connection...\n');

  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ Error: POSTGRES_URL not found in environment variables');
    console.log('Make sure .env.local exists and contains POSTGRES_URL');
    process.exit(1);
  }

  console.log('✓ POSTGRES_URL found in environment');
  
  // Mask password in connection string for display
  const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log(`✓ Connecting to: ${maskedUrl}\n`);

  try {
    const sql = neon(connectionString);
    
    // Test basic connection
    console.log('Testing connection...');
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    console.log('✅ Connection successful!');
    console.log(`   Time: ${result[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result[0].db_version.split(' ')[0]} ${result[0].db_version.split(' ')[1]}\n`);

    // Check if tables exist
    console.log('Checking database schema...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found. You need to run the schema setup.');
      console.log('\nTo set up the database schema:');
      console.log('  1. cat db/schema.sql');
      console.log('  2. cat db/migrations/003_add_question_stats.sql');
      console.log('  3. Execute both in your Neon SQL Editor (https://console.neon.tech/)\n');
      return;
    }

    console.log('✅ Tables found:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    // Check for required tables
    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['users', 'sessions', 'user_stats', 'question_stats'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing required tables:', missingTables.join(', '));
      console.log('Run the migrations to create missing tables.');
    } else {
      console.log('\n✅ All required tables exist!');
      
      // Check user count
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`\n📊 Current data:`);
      console.log(`   Users: ${userCount[0].count}`);
      
      if (userCount[0].count === '0') {
        console.log('\n💡 Tip: You need to create users to start using the app.');
        console.log('   Users can be created through the app UI at http://localhost:3000');
      }
    }

  } catch (error) {
    console.error('\n❌ Error connecting to database:');
    console.error(error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Password authentication failed. Please check:');
      console.log('   - The connection string is correct');
      console.log('   - The password has not been reset in Neon console');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Database does not exist. Please check:');
      console.log('   - The database name in the connection string');
      console.log('   - The database exists in your Neon project');
    }
    
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

verifyConnection();
