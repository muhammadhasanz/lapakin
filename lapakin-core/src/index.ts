import 'reflect-metadata';
import config from '@/config/index.ts';
import '@/infrastructure/loaders/manager.ts';
import { pool } from '@/infrastructure/database/drizzle/index.ts';
import app from '@/infrastructure/http/app.ts';

const server = app.start(config.app.port);

const shutdown = (signal: string) => {
  console.log(`[App] Signal ${signal} received, closing server...`);
  server.close(async () => {
    await pool.end();
    console.log('[App] Server closed gracefully.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
