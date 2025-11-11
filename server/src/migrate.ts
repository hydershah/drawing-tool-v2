/**
 * Database migration script
 * Creates all tables in PostgreSQL
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('[Migration] Starting database migration...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('[Migration] Migration completed successfully!');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
  }

  await pool.end();
}

main();
