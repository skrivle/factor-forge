const { config } = require('dotenv');
const { neon } = require('@neondatabase/serverless');

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL);

async function verifyUserPin(name, pin) {
  const result = await sql`
    SELECT * FROM users WHERE name = ${name} AND pin = ${pin}
  `;
  return result[0];
}

async function testLogin() {
  try {
    console.log('Testing login with Jelle / 1111...\n');
    
    const user = await verifyUserPin('Jelle', '1111');
    
    if (user) {
      console.log('✅ Login successful!');
      console.log('User:', {
        id: user.id,
        name: user.name,
        role: user.role,
      });
    } else {
      console.log('❌ Login failed - user not found or invalid PIN');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();
