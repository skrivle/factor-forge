const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

async function migrate() {
  try {
    console.log('Running migration: Remove streak tracking fields from user_stats...\n');
    
    // Check if columns exist first
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_stats' 
        AND column_name IN ('current_streak', 'last_played_date')
    `;
    
    if (columns.length === 0) {
      console.log('✓ Columns already removed. Nothing to do.');
      return;
    }
    
    console.log(`Found ${columns.length} columns to remove:`, columns.map(c => c.column_name).join(', '));
    
    // Remove the columns
    await sql`
      ALTER TABLE user_stats 
        DROP COLUMN IF EXISTS current_streak,
        DROP COLUMN IF EXISTS last_played_date
    `;
    
    console.log('✓ Migration completed successfully!');
    console.log('\nNote: Streaks are now calculated dynamically from session data.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
