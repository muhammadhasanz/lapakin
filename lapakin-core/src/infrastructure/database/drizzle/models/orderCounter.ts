import { date, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';

export const orderCounters = pgTable(
  'order_counters',
  {
    day: date('day', { mode: 'string' }).notNull(),
    lastSeq: integer('last_seq').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day] })],
);

export type OrderCounterRow = typeof orderCounters.$inferSelect;
