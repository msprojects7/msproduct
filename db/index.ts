import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index';

const { Pool } = pg;

// Prevent multiple connection pools during development hot reloading
const globalForDb = globalThis as unknown as {
  dbPool: pg.Pool | undefined;
};

export const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbPool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;
export * from './schema/index';
