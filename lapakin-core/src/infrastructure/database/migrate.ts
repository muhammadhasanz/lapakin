import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './drizzle/index.ts';

console.log('[Migrate] Running Drizzle migrations...');
const migrationsFolder = path.resolve(import.meta.dirname, './drizzle/migrations');
await migrate(db, { migrationsFolder });
console.log('[Migrate] Migrations applied successfully.');
await pool.end();
