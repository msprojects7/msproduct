import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const { Pool } = pg;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const url = new URL(connectionString);
  console.log(`Connecting to: ${url.hostname}${url.pathname}`);

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    console.log('Applying migrations from ./db/migrations...');
    await migrate(db, { migrationsFolder: './db/migrations' });
    console.log('✓ Migrations successfully executed!');
  } catch (error) {
    console.error('Migration execution failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigration();
