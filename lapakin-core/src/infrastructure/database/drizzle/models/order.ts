import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from './common.ts';
import { customers } from './customer.ts';
import { users } from './user.ts';

export const orders = pgTable(
  'orders',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    orderNumber: varchar('order_number', { length: 30 }).notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    orderDate: timestamp('order_date', { withTimezone: true }).notNull().defaultNow(),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => [
    check('orders_total_nonneg', sql`${t.totalAmount} >= 0`),
    index('orders_date_idx').on(t.orderDate),
    index('orders_customer_idx').on(t.customerId),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
