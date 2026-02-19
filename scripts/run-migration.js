// Run the adaptive learning migration using Node.js
const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

// Simple .env.local parser
function loadEnv() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const lines = envFile.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  }
}

async function runMigration() {
  console.log('🚀 Starting Adaptive Learning Feature Migration...\n');

  // Load environment variables
  loadEnv();

  if (!process.env.POSTGRES_URL) {
    console.error('❌ Error: POSTGRES_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.POSTGRES_URL);
  
  try {
    console.log('📊 Creating question_stats table...');
    
    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS question_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        
        num1 INTEGER NOT NULL,
        num2 INTEGER NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('multiplication', 'division')),
        correct_answer INTEGER NOT NULL,
        
        user_answer INTEGER,
        is_correct BOOLEAN NOT NULL,
        time_taken DECIMAL,
        
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Table created successfully');

    console.log('📊 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_question_stats_user_id ON question_stats(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_question_stats_session_id ON question_stats(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_question_stats_question ON question_stats(user_id, num1, num2, operation)`;
    console.log('✅ Indexes created successfully');

    console.log('📊 Creating view...');
    await sql`
      CREATE OR REPLACE VIEW user_weak_questions AS
      SELECT 
        user_id,
        num1,
        num2,
        operation,
        COUNT(*) as times_seen,
        SUM(CASE WHEN is_correct THEN 0 ELSE 1 END) as times_incorrect,
        AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as accuracy_rate,
        AVG(time_taken) as avg_time_taken
      FROM question_stats
      GROUP BY user_id, num1, num2, operation
      HAVING COUNT(*) >= 2
      ORDER BY accuracy_rate ASC, times_incorrect DESC
    `;
    console.log('✅ View created successfully');

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Play a few game sessions to generate data');
    console.log('3. Try the new "Slimme Oefening" (Smart Practice) mode\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
