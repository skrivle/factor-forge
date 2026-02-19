const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

function getTodayString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

async function debugTilda() {
  try {
    console.log('Debugging Tilda\'s streak...\n');
    
    const tilda = await sql`SELECT id, name FROM users WHERE name = 'Tilda'`;
    const userId = tilda[0].id;
    
    console.log('1. Getting Tilda\'s sessions...');
    const sessions = await sql`
      SELECT 
        completed_at,
        completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels' as local_time,
        DATE(completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels') as play_date
      FROM sessions
      WHERE user_id = ${userId}
      ORDER BY completed_at DESC
      LIMIT 5
    `;
    
    console.log('Latest sessions:');
    sessions.forEach(s => {
      console.log(`  - completed_at: ${s.completed_at}`);
      console.log(`    local_time: ${s.local_time}`);
      console.log(`    play_date: ${s.play_date}`);
      console.log(`    play_date ISO: ${new Date(s.play_date).toISOString()}`);
    });
    
    console.log('\n2. Getting unique play dates...');
    const uniqueSessions = await sql`
      SELECT DISTINCT
        DATE(completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels') as play_date
      FROM sessions
      WHERE user_id = ${userId}
      ORDER BY play_date DESC
    `;
    
    const uniqueDates = uniqueSessions.map((s) => {
      const d = new Date(s.play_date);
      return d.toISOString().split('T')[0];
    });
    
    console.log('Unique dates:', uniqueDates);
    
    console.log('\n3. Date comparison...');
    const todayStr = getTodayString();
    console.log(`Today (getTodayString): ${todayStr}`);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Brussels',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const yesterdayStr = yesterdayFormatter.format(yesterday);
    console.log(`Yesterday: ${yesterdayStr}`);
    
    const mostRecentPlay = uniqueDates[0];
    console.log(`Most recent play: ${mostRecentPlay}`);
    
    console.log('\n4. Comparison checks:');
    console.log(`mostRecentPlay === todayStr? ${mostRecentPlay} === ${todayStr} = ${mostRecentPlay === todayStr}`);
    console.log(`mostRecentPlay === yesterdayStr? ${mostRecentPlay} === ${yesterdayStr} = ${mostRecentPlay === yesterdayStr}`);
    
    const shouldHaveStreak = mostRecentPlay === todayStr || mostRecentPlay === yesterdayStr;
    console.log(`Should have active streak? ${shouldHaveStreak}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTilda();
