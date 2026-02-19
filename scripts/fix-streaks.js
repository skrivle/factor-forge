const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

async function fixStreaks() {
  try {
    console.log('Recalculating streaks based on actual session data...\n');
    
    // Get all users
    const users = await sql`SELECT id, name FROM users`;
    
    for (const user of users) {
      console.log(`\nProcessing ${user.name}...`);
      
      // Get all sessions for this user
      const sessions = await sql`
        SELECT 
          completed_at,
          completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels' as local_time
        FROM sessions
        WHERE user_id = ${user.id}
        ORDER BY completed_at DESC
      `;
      
      if (sessions.length === 0) {
        console.log(`  No sessions found. Setting streak to 0.`);
        await sql`
          UPDATE user_stats
          SET current_streak = 0,
              last_played_date = NULL
          WHERE user_id = ${user.id}
        `;
        continue;
      }
      
      // Get unique dates in local timezone
      const uniqueDates = [...new Set(sessions.map(s => {
        const d = new Date(s.local_time);
        return d.toISOString().split('T')[0];
      }))].sort().reverse();
      
      console.log(`  Unique play dates: ${uniqueDates.length}`);
      console.log(`  Dates: ${uniqueDates.join(', ')}`);
      
      // Calculate streak
      const now = new Date(); // Local time
      const todayStr = now.toISOString().split('T')[0];
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      console.log(`  Today (local): ${todayStr}`);
      console.log(`  Yesterday (local): ${yesterdayStr}`);
      console.log(`  Most recent play: ${uniqueDates[0]}`);
      
      let streak = 0;
      let lastPlayedDate = uniqueDates[0];
      
      // Streak only counts if played today or yesterday
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        let currentCheckDate = new Date(uniqueDates[0]);
        
        // Check consecutive days backwards
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i]);
          const expectedPrevDate = new Date(currentCheckDate);
          expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
          
          // Compare YYYY-MM-DD strings
          const prevDateStr = prevDate.toISOString().split('T')[0];
          const expectedStr = expectedPrevDate.toISOString().split('T')[0];
          
          if (prevDateStr === expectedStr) {
            streak++;
            currentCheckDate = prevDate;
          } else {
            break; // Streak is broken
          }
        }
      }
      
      console.log(`  Calculated streak: ${streak}`);
      console.log(`  Last played: ${lastPlayedDate}`);
      
      // Update the database
      await sql`
        UPDATE user_stats
        SET current_streak = ${streak},
            last_played_date = ${lastPlayedDate}::date
        WHERE user_id = ${user.id}
      `;
      
      console.log(`  ✓ Updated`);
    }
    
    console.log('\n✅ All streaks recalculated!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixStreaks();
