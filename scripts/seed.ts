/**
 * Development seeder — populates the database with sample data.
 * Run: npm run seed  OR  yarn seed
 */

import 'dotenv/config';
import { initDb, closeDb, getDb } from '../src/core/db';
import { hashPassword } from '../src/shared/utils/hash';

async function seed() {
  await initDb();
  const sql = getDb();

  console.log('🌱 Seeding database...');

  // Truncate to make seeding idempotent in dev
  await sql`TRUNCATE users RESTART IDENTITY CASCADE`;

  const passwordHash = await hashPassword('password123');

  await sql`
    INSERT INTO users (name, email, password_hash) VALUES
      ('Alice Admin',  'alice@example.com', ${passwordHash}),
      ('Bob Builder',  'bob@example.com',   ${passwordHash}),
      ('Carol Coder',  'carol@example.com', ${passwordHash})
  `;

  console.log('✓ Users seeded');
  console.log('\nTest credentials:');
  console.log('  email: alice@example.com | password: password123');

  await closeDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
