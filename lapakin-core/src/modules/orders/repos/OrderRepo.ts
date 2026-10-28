import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import db, { type Transaction } from '@/infrastructure/database/drizzle/index.ts';
import {
  customers,
  orderItems,
  orders,
  products,
  users,
} from '@/infrastructure/database/drizzle/schema.ts';
import { BadRequestError, Container, centsToDecimal, Service, toCents } from '@/shared/index.ts';
import InsufficientStockError from '../domain/InsufficientStockError.ts';
import { Order } from '../domain/Order.ts';
import { OrderId } from '../domain/OrderId.ts';
import { OrderItem } from '../domain/OrderItem.ts';
import { OrderItemId } from '../domain/OrderItemId.ts';
import OrderCounterRepo from './OrderCounterRepo.ts';

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderParams {
  customerId: string;
  createdBy: string;
  items: CreateOrderItemInput[];
  orderDate?: Date;
}

export interface ListOrderParams {
  page: number;
  per_page: number;
  from?: string;
  to?: string;
  customer_id?: string;
}

export interface ListOrderResult {
  docs: Order[];
  total: number;
}

@Service()
export default class OrderRepo {
  constructor(private orderCounterRepo: OrderCounterRepo = Container.get(OrderCounterRepo)) {}

  async createOrderWithItems(params: CreateOrderParams): Promise<Order> {
    return await db.transaction(async (tx) => {
      // 1. Check active customer
      const [customer] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.id, params.customerId), isNull(customers.deletedAt)))
        .limit(1);

      if (!customer) {
        throw new BadRequestError('Customer not found or inactive', {
          customer_id: ['Customer is invalid or has been deleted'],
        });
      }

      // 2. Lock product rows in deterministic sorted order to prevent deadlocks
      const uniqueProductIds = [...new Set(params.items.map((i) => i.productId))].sort(
        (a, b) => a - b,
      );

      const lockedProducts = await tx
        .select()
        .from(products)
        .where(and(inArray(products.id, uniqueProductIds), isNull(products.deletedAt)))
        .for('update');

      const productMap = new Map(lockedProducts.map((p) => [p.id, p]));

      // 3. Validate stock for each item
      const errors: Record<string, string[]> = {};
      const productTotalsNeeded = new Map<number, number>();

      for (let i = 0; i < params.items.length; i++) {
        const item = params.items[i]!;
        const currentTotal = (productTotalsNeeded.get(item.productId) ?? 0) + item.quantity;
        productTotalsNeeded.set(item.productId, currentTotal);

        const prod = productMap.get(item.productId);
        if (!prod) {
          errors[`items.${i}.product_id`] = [
            `Product ID ${item.productId} was not found or has been deleted`,
          ];
        } else if (prod.stock < currentTotal) {
          errors[`items.${i}.quantity`] = [
            `Remaining stock for ${prod.productName} is ${prod.stock}, requested ${currentTotal}`,
          ];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new InsufficientStockError(errors);
      }

      // 4. Calculate total and line subtotal in integer cents
      let totalAmountCents = 0;
      const preparedItems: {
        productId: number;
        productCode: string;
        productName: string;
        quantity: number;
        unitPrice: string;
        subtotal: string;
      }[] = [];

      for (const item of params.items) {
        const prod = productMap.get(item.productId)!;
        const unitPriceCents = toCents(prod.price);
        const subtotalCents = unitPriceCents * item.quantity;
        totalAmountCents += subtotalCents;

        preparedItems.push({
          productId: prod.id,
          productCode: prod.productCode,
          productName: prod.productName,
          quantity: item.quantity,
          unitPrice: prod.price,
          subtotal: centsToDecimal(subtotalCents),
        });
      }

      // 5. Decrement inventory stock
      for (const [productId, quantityNeeded] of productTotalsNeeded.entries()) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${quantityNeeded}`,
          })
          .where(eq(products.id, productId));
      }

      // 6. Generate unique atomic order number
      const orderDate = params.orderDate ?? new Date();
      const orderNumber = await this.orderCounterRepo.getNextOrderNumber(tx, orderDate);

      // 7. Save Order record
      const [savedOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId: params.customerId,
          createdBy: params.createdBy,
          orderDate,
          totalAmount: centsToDecimal(totalAmountCents),
        })
        .returning();

      // 8. Save Order Items records
      const savedItems = await tx
        .insert(orderItems)
        .values(
          preparedItems.map((item) => ({
            orderId: savedOrder!.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        )
        .returning();

      const domainItems = savedItems.map((si, idx) => {
        const prep = preparedItems[idx]!;
        return OrderItem.create(
          {
            orderId: si.orderId,
            productId: si.productId,
            productCode: prep.productCode,
            productName: prep.productName,
            quantity: si.quantity,
            unitPrice: si.unitPrice,
            subtotal: si.subtotal,
            createdAt: si.createdAt,
            updatedAt: si.updatedAt,
          },
          new OrderItemId(si.id),
        );
      });

      return Order.create(
        {
          orderNumber: savedOrder!.orderNumber,
          customerId: savedOrder!.customerId,
          customerName: customer.customerName,
          createdBy: savedOrder!.createdBy,
          orderDate: savedOrder!.orderDate,
          totalAmount: savedOrder!.totalAmount,
          items: domainItems,
          createdAt: savedOrder!.createdAt,
          updatedAt: savedOrder!.updatedAt,
        },
        new OrderId(savedOrder!.id),
      );
    });
  }

  async list(params: ListOrderParams): Promise<ListOrderResult> {
    const conditions = [];

    if (params.customer_id) {
      conditions.push(eq(orders.customerId, params.customer_id));
    }
    if (params.from) {
      const fromDate = new Date(`${params.from}T00:00:00.000Z`);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(orders.orderDate, fromDate));
      }
    }
    if (params.to) {
      const toDate = new Date(`${params.to}T23:59:59.999Z`);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(orders.orderDate, toDate));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [count]] = await Promise.all([
      db
        .select({
          order: orders,
          customerName: customers.customerName,
          createdByName: users.name,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(users, eq(orders.createdBy, users.id))
        .where(where)
        .orderBy(desc(orders.orderDate), desc(orders.id))
        .limit(params.per_page)
        .offset((params.page - 1) * params.per_page),
      db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where),
    ]);

    const orderList = rows.map((r) =>
      Order.create(
        {
          orderNumber: r.order.orderNumber,
          customerId: r.order.customerId,
          customerName: r.customerName ?? undefined,
          createdBy: r.order.createdBy,
          createdByName: r.createdByName ?? undefined,
          orderDate: r.order.orderDate,
          totalAmount: r.order.totalAmount,
          createdAt: r.order.createdAt,
          updatedAt: r.order.updatedAt,
        },
        new OrderId(r.order.id),
      ),
    );

    return {
      docs: orderList,
      total: count?.total ?? 0,
    };
  }

  async show(id: number): Promise<Order | null> {
    const [orderRow] = await db
      .select({
        order: orders,
        customerName: customers.customerName,
        createdByName: users.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.createdBy, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!orderRow) return null;

    const itemRows = await db
      .select({
        item: orderItems,
        productCode: products.productCode,
        productName: products.productName,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id))
      .orderBy(asc(orderItems.id));

    const domainItems = itemRows.map((ir) =>
      OrderItem.create(
        {
          orderId: ir.item.orderId,
          productId: ir.item.productId,
          productCode: ir.productCode ?? undefined,
          productName: ir.productName ?? undefined,
          quantity: ir.item.quantity,
          unitPrice: ir.item.unitPrice,
          subtotal: ir.item.subtotal,
          createdAt: ir.item.createdAt,
          updatedAt: ir.item.updatedAt,
        },
        new OrderItemId(ir.item.id),
      ),
    );

    return Order.create(
      {
        orderNumber: orderRow.order.orderNumber,
        customerId: orderRow.order.customerId,
        customerName: orderRow.customerName ?? undefined,
        createdBy: orderRow.order.createdBy,
        createdByName: orderRow.createdByName ?? undefined,
        orderDate: orderRow.order.orderDate,
        totalAmount: orderRow.order.totalAmount,
        items: domainItems,
        createdAt: orderRow.order.createdAt,
        updatedAt: orderRow.order.updatedAt,
      },
      new OrderId(orderRow.order.id),
    );
  }
}
