const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

async function debugStreak() {
  try {
    console.log('Fetching Jelle\'s data...\n');
    
    // Get all users first to see what's in the DB
    const allUsers = await sql`SELECT id, name, role FROM users`;
    console.log('All users in DB:');
    allUsers.forEach(u => console.log(`  - ${u.name} (${u.role})`));
    console.log('\n');
    
    // Get Jelle's user ID (case-insensitive)
    const users = await sql`SELECT id, name, role FROM users WHERE LOWER(name) = 'jelle'`;
    if (users.length === 0) {
      console.log('User Jelle not found');
      return;
    }
    
    const user = users[0];
    console.log('User:', user);
    console.log('User ID:', user.id, '\n');
    
    // Get user stats
    const stats = await sql`SELECT * FROM user_stats WHERE user_id = ${user.id}`;
    console.log('User Stats:');
    console.log(stats[0]);
    console.log('\n');
    
    // Get all sessions
    const sessions = await sql`
      SELECT 
        completed_at,
        score,
        accuracy,
        DATE(completed_at) as play_date
      FROM sessions
      WHERE user_id = ${user.id}
      ORDER BY completed_at DESC
    `;
    
    console.log(`Total sessions: ${sessions.length}\n`);
    console.log('Sessions by date:');
    
    // Group by date
    const byDate = {};
    sessions.forEach(s => {
      const date = s.play_date;
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(s);
    });
    
    Object.keys(byDate).sort().reverse().forEach(date => {
      console.log(`  ${date}: ${byDate[date].length} sessions`);
    });
    
    console.log('\n--- Analysis ---');
    console.log('Stored current_streak:', stats[0]?.current_streak);
    console.log('Unique play dates:', Object.keys(byDate).length);
    console.log('Last played date (from stats):', stats[0]?.last_played_date);
    
    // Get Tilda's data too
    console.log('\n\n=== TILDA\'S DATA ===\n');
    const tildaUsers = await sql`SELECT id, name, role FROM users WHERE name = 'Tilda'`;
    if (tildaUsers.length > 0) {
      const tilda = tildaUsers[0];
      const tildaStats = await sql`SELECT * FROM user_stats WHERE user_id = ${tilda.id}`;
      const tildaSessions = await sql`
        SELECT 
          completed_at,
          DATE(completed_at) as play_date
        FROM sessions
        WHERE user_id = ${tilda.id}
        ORDER BY completed_at DESC
      `;
      
      console.log('User:', tilda);
      console.log('Stats:', tildaStats[0]);
      console.log(`Total sessions: ${tildaSessions.length}`);
      
      const tildaByDate = {};
      tildaSessions.forEach(s => {
        const date = s.play_date;
        if (!tildaByDate[date]) {
          tildaByDate[date] = [];
        }
        tildaByDate[date].push(s);
      });
      
      console.log('Sessions by date:');
      Object.keys(tildaByDate).sort().reverse().forEach(date => {
        console.log(`  ${date}: ${tildaByDate[date].length} sessions`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugStreak();
