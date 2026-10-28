import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import db from '@/infrastructure/database/drizzle/index.ts';
import { type ProductRow, products } from '@/infrastructure/database/drizzle/schema.ts';
import { Service } from '@/shared/index.ts';
import type { Product } from '../domain/Product.ts';
import { ProductMapper } from '../mappers/ProductMapper.ts';

export interface ListProductParams {
  page: number;
  per_page: number;
  search?: string;
  sort?: 'product_name' | 'price' | 'stock';
  order?: 'asc' | 'desc';
}

export interface ListProductResult {
  docs: Product[];
  total: number;
}

const sortMap = {
  product_name: products.productName,
  price: products.price,
  stock: products.stock,
} as const;

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

@Service()
export default class ProductRepo {
  async save(product: Product): Promise<Product> {
    const data = ProductMapper.toPersistence(product);
    const [saved] = await db
      .insert(products)
      .values({
        productCode: data.productCode,
        productName: data.productName,
        stock: data.stock,
        price: data.price,
      })
      .returning();
    return ProductMapper.toDomain(saved as ProductRow);
  }

  async show(id: number): Promise<Product | null> {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);
    if (!row) return null;
    return ProductMapper.toDomain(row);
  }

  async findByCode(code: string): Promise<Product | null> {
    const [row] = await db.select().from(products).where(eq(products.productCode, code)).limit(1);
    if (!row) return null;
    return ProductMapper.toDomain(row);
  }

  async update(id: number, product: Product): Promise<Product | null> {
    const data = ProductMapper.toPersistence(product);
    const [updated] = await db
      .update(products)
      .set({
        productCode: data.productCode,
        productName: data.productName,
        stock: data.stock,
        price: data.price,
      })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning();
    if (!updated) return null;
    return ProductMapper.toDomain(updated as ProductRow);
  }

  async destroy(id: number): Promise<boolean> {
    const [row] = await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning({ id: products.id });
    return Boolean(row);
  }

  async list(params: ListProductParams): Promise<ListProductResult> {
    const term = params.search?.trim();
    const where = and(
      isNull(products.deletedAt),
      term
        ? or(
            ilike(products.productName, `%${escapeLike(term)}%`),
            ilike(products.productCode, `%${escapeLike(term)}%`),
          )
        : undefined,
    );

    const sortCol = sortMap[params.sort ?? 'product_name'] ?? products.productName;
    const sortDir = params.order === 'desc' ? desc : asc;

    const [rows, [count]] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(sortDir(sortCol), asc(products.id))
        .limit(params.per_page)
        .offset((params.page - 1) * params.per_page),
      db.select({ total: sql<number>`count(*)::int` }).from(products).where(where),
    ]);

    return {
      docs: rows.map(ProductMapper.toDomain),
      total: count?.total ?? 0,
    };
  }
}
