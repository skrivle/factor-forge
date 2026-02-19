const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

// Simplified calculateStreak function (matches the one in queries.ts)
function getTodayString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

async function calculateStreak(userId) {
  const sessions = await sql`
    SELECT DISTINCT
      DATE(completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels') as play_date
    FROM sessions
    WHERE user_id = ${userId}
    ORDER BY play_date DESC
  `;

  if (sessions.length === 0) {
    return 0;
  }

  const uniqueDates = sessions.map((s) => {
    const d = new Date(s.play_date);
    return d.toISOString().split('T')[0];
  });

  const todayStr = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const yesterdayStr = yesterdayFormatter.format(yesterday);

  const mostRecentPlay = uniqueDates[0];

  if (mostRecentPlay !== todayStr && mostRecentPlay !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(mostRecentPlay);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const expectedPrevDate = new Date(currentDate);
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);

    const prevDateStr = prevDate.toISOString().split('T')[0];
    const expectedStr = expectedPrevDate.toISOString().split('T')[0];

    if (prevDateStr === expectedStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

async function testStreaks() {
  try {
    console.log('Testing dynamic streak calculation...\n');
    
    const users = await sql`SELECT id, name, role FROM users`;
    
    for (const user of users) {
      const streak = await calculateStreak(user.id);
      const stats = await sql`SELECT * FROM user_stats WHERE user_id = ${user.id}`;
      
      console.log(`${user.name} (${user.role}):`);
      console.log(`  Calculated streak: ${streak}`);
      console.log(`  Stats in DB:`, stats[0] || 'None');
      console.log('');
    }
    
    console.log('✅ All streaks are now calculated dynamically from session data!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testStreaks();
