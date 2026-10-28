import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/drizzle/schema.ts',
  out: './src/infrastructure/database/drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://lapakin:lapakin@localhost:5433/lapakin',
  },
});
