import { date, index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { genderEnum, timestamps } from './common.ts';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerName: varchar('customer_name', { length: 150 }).notNull(),
    customerAddress: varchar('customer_address', { length: 255 }).notNull(),
    gender: genderEnum('gender').notNull(),
    birthDate: date('birth_date', { mode: 'string' }).notNull(),
    phone: varchar('phone', { length: 20 }),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('customers_name_idx').on(t.customerName),
    index('customers_deleted_idx').on(t.deletedAt),
  ],
);

export type CustomerRow = typeof customers.$inferSelect;
