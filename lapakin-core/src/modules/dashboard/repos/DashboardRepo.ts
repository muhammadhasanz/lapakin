import { and, asc, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import db from '@/infrastructure/database/drizzle/index.ts';
import { orderItems, orders, products } from '@/infrastructure/database/drizzle/schema.ts';
import { Service, toNumber } from '@/shared/index.ts';

export interface DashboardSummaryData {
  total_transactions: number;
  total_sales: number;
  top_products: {
    id: number;
    product_code: string;
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }[];
  low_stock_products: {
    id: number;
    product_code: string;
    product_name: string;
    stock: number;
    price: number;
  }[];
}

@Service()
export default class DashboardRepo {
  async getSummary(): Promise<DashboardSummaryData> {
    const [txCount] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);

    const [salesSum] = await db
      .select({ sum: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders);

    const topSelling = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        productName: products.productName,
        totalSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        totalRevenue: sql<string>`coalesce(sum(${orderItems.subtotal}), 0)`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .groupBy(products.id, products.productCode, products.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5);

    const lowStock = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        productName: products.productName,
        stock: products.stock,
        price: products.price,
      })
      .from(products)
      .where(and(lt(products.stock, 5), isNull(products.deletedAt)))
      .orderBy(asc(products.stock), asc(products.id));

    return {
      total_transactions: txCount?.count ?? 0,
      total_sales: toNumber(salesSum?.sum ?? '0'),
      top_products: topSelling.map((tp) => ({
        id: tp.id,
        product_code: tp.productCode,
        product_name: tp.productName,
        total_sold: tp.totalSold,
        total_revenue: toNumber(tp.totalRevenue),
      })),
      low_stock_products: lowStock.map((ls) => ({
        id: ls.id,
        product_code: ls.productCode,
        product_name: ls.productName,
        stock: ls.stock,
        price: toNumber(ls.price),
      })),
    };
  }
}
