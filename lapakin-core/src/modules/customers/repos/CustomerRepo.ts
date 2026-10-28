import { and, asc, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import db from '@/infrastructure/database/drizzle/index.ts';
import { type CustomerRow, customers } from '@/infrastructure/database/drizzle/schema.ts';
import { Service } from '@/shared/index.ts';
import type { Customer } from '../domain/Customer.ts';
import { CustomerMapper } from '../mappers/CustomerMapper.ts';

export interface ListCustomerParams {
  page: number;
  per_page: number;
  search?: string;
}

export interface ListCustomerResult {
  docs: Customer[];
  total: number;
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

@Service()
export default class CustomerRepo {
  async save(customer: Customer): Promise<Customer> {
    const data = CustomerMapper.toPersistence(customer);
    const [saved] = await db
      .insert(customers)
      .values({
        id: data.id,
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        gender: data.gender,
        birthDate: data.birthDate,
        phone: data.phone,
      })
      .returning();
    return CustomerMapper.toDomain(saved as CustomerRow);
  }

  async show(id: string): Promise<Customer | null> {
    const [row] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1);
    if (!row) return null;
    return CustomerMapper.toDomain(row);
  }

  async update(id: string, customer: Customer): Promise<Customer | null> {
    const data = CustomerMapper.toPersistence(customer);
    const [updated] = await db
      .update(customers)
      .set({
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        gender: data.gender,
        birthDate: data.birthDate,
        phone: data.phone,
      })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning();
    if (!updated) return null;
    return CustomerMapper.toDomain(updated as CustomerRow);
  }

  async destroy(id: string): Promise<boolean> {
    const [row] = await db
      .update(customers)
      .set({ deletedAt: new Date() })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning({ id: customers.id });
    return Boolean(row);
  }

  async list(params: ListCustomerParams): Promise<ListCustomerResult> {
    const term = params.search?.trim();
    const where = and(
      isNull(customers.deletedAt),
      term ? ilike(customers.customerName, `%${escapeLike(term)}%`) : undefined,
    );

    const [rows, [count]] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(where)
        .orderBy(desc(customers.createdAt), asc(customers.id))
        .limit(params.per_page)
        .offset((params.page - 1) * params.per_page),
      db.select({ total: sql<number>`count(*)::int` }).from(customers).where(where),
    ]);

    return {
      docs: rows.map(CustomerMapper.toDomain),
      total: count?.total ?? 0,
    };
  }
}
