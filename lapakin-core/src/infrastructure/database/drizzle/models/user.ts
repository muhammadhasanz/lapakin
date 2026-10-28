import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './common.ts';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  ...timestamps,
});

export type UserRow = typeof users.$inferSelect;
