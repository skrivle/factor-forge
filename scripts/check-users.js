const { config } = require('dotenv');
const { neon } = require('@neondatabase/serverless');

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL);

async function checkUsers() {
  try {
    console.log('Checking users in database...\n');
    
    const users = await sql`
      SELECT id, name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('\nYou need to create a user first. Run this query:');
      console.log("INSERT INTO users (name, pin, role) VALUES ('YourName', '1234', 'parent');");
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Created: ${user.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
