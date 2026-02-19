const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

async function testQuery() {
  try {
    const tilda = await sql`SELECT id FROM users WHERE name = 'Tilda'`;
    const userId = tilda[0].id;
    
    console.log('Testing TO_CHAR query:');
    const sessions = await sql`
      SELECT DISTINCT
        TO_CHAR(completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels', 'YYYY-MM-DD') as play_date
      FROM sessions
      WHERE user_id = ${userId}
      ORDER BY play_date DESC
    `;
    
    console.log('Result:', sessions);
    console.log('play_date value:', sessions[0].play_date);
    console.log('play_date type:', typeof sessions[0].play_date);
    
    // Compare with today
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Brussels',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatter.format(yesterday);
    
    console.log('\nComparison:');
    console.log('Today:', todayStr);
    console.log('Yesterday:', yesterdayStr);
    console.log('Tilda played:', sessions[0].play_date);
    console.log('Match today?', sessions[0].play_date === todayStr);
    console.log('Match yesterday?', sessions[0].play_date === yesterdayStr);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();
