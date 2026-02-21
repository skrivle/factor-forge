import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Skip migrations when no DB URL (e.g. Vercel preview builds without a DB)
if (!process.env.POSTGRES_URL) {
  console.log('⏭️  Skipping migrations: POSTGRES_URL not set');
  process.exit(0);
}

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function main() {
  console.log('🔄 Running Drizzle migrations...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
