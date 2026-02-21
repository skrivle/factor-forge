const { config } = require('dotenv');
const { neon } = require('@neondatabase/serverless');

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL);

async function checkUsersPins() {
  try {
    console.log('Checking users and their PINs in database...\n');
    
    const users = await sql`
      SELECT id, name, pin, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach(user => {
        console.log(`- Name: ${user.name}`);
        console.log(`  PIN: ${user.pin}`);
        console.log(`  Role: ${user.role}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsersPins();
