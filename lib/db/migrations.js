/**
 * Database Migration System
 * Compatible with both CommonJS (scripts) and ES modules (Next.js)
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

/**
 * Creates the migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

/**
 * Gets all applied migrations from the database
 */
async function getAppliedMigrations(sql) {
  const result = await sql`
    SELECT id FROM schema_migrations ORDER BY id
  `;
  return new Set(result.map((row) => row.id));
}

/**
 * Records a migration as applied
 */
async function recordMigration(sql, id, name) {
  await sql`
    INSERT INTO schema_migrations (id, name, applied_at)
    VALUES (${id}, ${name}, NOW())
  `;
}

/**
 * Gets all migration files from the migrations directory
 */
function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) return null;
      
      return {
        id: parseInt(match[1], 10),
        name: match[2],
        path: path.join(migrationsDir, file)
      };
    })
    .filter(f => f !== null)
    .sort((a, b) => a.id - b.id);

  return files;
}

/**
 * Runs a single migration file
 */
async function runMigration(sql, migration) {
  console.log(`  Applying migration ${migration.id}: ${migration.name}...`);
  
  const sql_content = fs.readFileSync(migration.path, 'utf-8');
  
  // Split by semicolons but be careful with function definitions
  const statements = sql_content
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      await sql.unsafe(statement);
    }
  }

  await recordMigration(sql, migration.id, migration.name);
  console.log(`  ✓ Migration ${migration.id} applied successfully`);
}

/**
 * Runs the initial schema if no tables exist
 */
async function runInitialSchema(sql) {
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.log('⚠️  No schema.sql found, skipping initial schema');
    return;
  }

  console.log('📋 Running initial schema...');
  const schema_content = fs.readFileSync(schemaPath, 'utf-8');
  
  const statements = schema_content
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      await sql.unsafe(statement);
    }
  }
  
  console.log('✓ Initial schema applied');
}

/**
 * Checks if the database has any tables
 */
async function hasExistingTables(sql) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name != 'schema_migrations'
  `;
  return parseInt(result[0].count, 10) > 0;
}

/**
 * Main migration runner
 */
async function runMigrations() {
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const sql = neon(connectionString);

  try {
    console.log('🔄 Starting database migrations...');

    // Ensure migrations tracking table exists
    await ensureMigrationsTable(sql);

    // Check if we need to run initial schema
    const tablesExist = await hasExistingTables(sql);
    if (!tablesExist) {
      await runInitialSchema(sql);
    }

    // Get all migration files
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('✓ No migration files found');
      return;
    }

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(sql);

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(m => !appliedMigrations.has(m.id));

    if (pendingMigrations.length === 0) {
      console.log('✓ All migrations are up to date');
      return;
    }

    console.log(`📝 Found ${pendingMigrations.length} pending migration(s)`);

    // Run pending migrations in order
    for (const migration of pendingMigrations) {
      await runMigration(sql, migration);
    }

    console.log(`✅ Successfully applied ${pendingMigrations.length} migration(s)`);

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    throw error;
  }
}

/**
 * Shows migration status without running them
 */
async function showMigrationStatus() {
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const sql = neon(connectionString);

  try {
    await ensureMigrationsTable(sql);
    
    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(sql);

    console.log('\n📊 Migration Status:\n');
    console.log('ID  | Status   | Name');
    console.log('----+----------+---------------------------');

    for (const migration of migrationFiles) {
      const status = appliedMigrations.has(migration.id) ? '✓ Applied' : '⏳ Pending';
      console.log(`${migration.id.toString().padStart(3)} | ${status} | ${migration.name}`);
    }

    const pendingCount = migrationFiles.filter(m => !appliedMigrations.has(m.id)).length;
    console.log('\n' + `Total: ${migrationFiles.length} migrations (${pendingCount} pending)\n`);

  } catch (error) {
    console.error('❌ Failed to get migration status:');
    console.error(error);
    throw error;
  }
}

module.exports = {
  runMigrations,
  showMigrationStatus
};
