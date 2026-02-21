import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);
const db = drizzle(sql);

async function hashExistingPins() {
  console.log('🔐 Checking for plain-text PINs to hash...');

  try {
    const users = await sql`
      SELECT id, name, pin FROM users
    `;

    if (users.length === 0) {
      console.log('   No users found.');
      return;
    }

    let hashedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if PIN is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isAlreadyHashed = /^\$2[aby]\$/.test(user.pin);

      if (isAlreadyHashed) {
        skippedCount++;
        continue;
      }

      // Hash the plain-text PIN
      const hashedPin = await bcrypt.hash(user.pin, 10);

      // Update the user's PIN
      await sql`
        UPDATE users 
        SET pin = ${hashedPin}
        WHERE id = ${user.id}
      `;

      console.log(`   ✓ Hashed PIN for user: ${user.name}`);
      hashedCount++;
    }

    if (hashedCount > 0) {
      console.log(`✅ Hashed ${hashedCount} PIN(s)`);
    } else if (skippedCount > 0) {
      console.log(`   All PINs already hashed (${skippedCount} users)`);
    }

  } catch (error) {
    console.error('❌ Error hashing PINs:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Running Drizzle migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully!');
    
    // Run PIN hashing after migrations
    await hashExistingPins();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
