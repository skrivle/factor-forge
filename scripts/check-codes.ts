import { sql } from '../lib/db/client';

async function checkCodes() {
  try {
    const codes = await sql`SELECT code, is_used, used_by FROM invite_codes ORDER BY code`;
    console.log('Invite Codes:');
    console.table(codes);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkCodes();
