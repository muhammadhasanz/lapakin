import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, numeric, pgTable } from 'drizzle-orm/pg-core';
import { timestamps } from './common.ts';
import { orders } from './order.ts';
import { products } from './product.ts';

export const orderItems = pgTable(
  'order_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    orderId: bigint('order_id', { mode: 'number' })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: bigint('product_id', { mode: 'number' })
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => [
    check('order_items_qty_positive', sql`${t.quantity} > 0`),
    index('order_items_order_idx').on(t.orderId),
    index('order_items_product_idx').on(t.productId),
  ],
);

export type OrderItemRow = typeof orderItems.$inferSelect;
