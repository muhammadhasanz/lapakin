import { pool } from '@/infrastructure/database/drizzle/index.ts';

export async function pingDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
