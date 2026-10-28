import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from './common.ts';

export const products = pgTable(
  'products',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    productCode: varchar('product_code', { length: 20 }).notNull().unique(),
    productName: varchar('product_name', { length: 150 }).notNull(),
    stock: integer('stock').notNull().default(0),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    check('products_stock_nonneg', sql`${t.stock} >= 0`),
    check('products_price_positive', sql`${t.price} > 0`),
    index('products_name_idx').on(t.productName),
    index('products_deleted_idx').on(t.deletedAt),
  ],
);

export type ProductRow = typeof products.$inferSelect;
