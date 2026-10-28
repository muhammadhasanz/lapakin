import { Mapper, toNumber } from '@/shared/index.ts';
import type { Order } from '../domain/Order.ts';
import type { OrderItem } from '../domain/OrderItem.ts';

export class OrderMapper extends Mapper<Order> {
  public static itemToDTO(item: OrderItem) {
    return {
      id: item.id,
      product_id: item.productId,
      product_code: item.productCode,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: toNumber(item.unitPrice),
      subtotal: toNumber(item.subtotal),
    };
  }

  public static toDTO(order: Order) {
    return {
      id: order.id,
      order_number: order.orderNumber,
      customer_id: order.customerId,
      customer_name: order.customerName,
      created_by: order.createdBy,
      created_by_name: order.createdByName,
      order_date: order.orderDate,
      total_amount: toNumber(order.totalAmount),
      items: order.items.map(OrderMapper.itemToDTO),
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  public static toListItemDTO(order: Order) {
    return {
      id: order.id,
      order_number: order.orderNumber,
      customer_id: order.customerId,
      customer_name: order.customerName,
      created_by: order.createdBy,
      created_by_name: order.createdByName,
      order_date: order.orderDate,
      total_amount: toNumber(order.totalAmount),
      total_items: order.items.length,
      created_at: order.createdAt,
    };
  }
}
