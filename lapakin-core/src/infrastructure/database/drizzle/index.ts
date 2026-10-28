import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import config from '@/config/index.ts';
import * as schema from './schema.ts';

export const pool = new pg.Pool({
  connectionString: config.app.db,
  max: 10,
});

pool.on('error', (err) => {
  console.error('PostgreSQL unexpected pool error:', err);
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export default db;
