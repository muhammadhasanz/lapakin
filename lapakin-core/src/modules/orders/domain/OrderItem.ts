import { Entity } from '@/shared/index.ts';
import type { OrderItemId } from './OrderItemId.ts';

export interface OrderItemProps {
  orderId?: number;
  productId: number;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitPrice: string; // snapshot price e.g. "12000.00"
  subtotal: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OrderItem extends Entity<OrderItemProps> {
  declare readonly _id: any;

  get id(): number {
    return this._id ? Number(this._id.toValue()) : 0;
  }

  get orderId(): number | undefined {
    return this.props.orderId;
  }

  get productId(): number {
    return this.props.productId;
  }

  get productCode(): string | undefined {
    return this.props.productCode;
  }

  get productName(): string | undefined {
    return this.props.productName;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): string {
    return this.props.unitPrice;
  }

  get subtotal(): string {
    return this.props.subtotal;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private constructor(props: OrderItemProps, id?: OrderItemId) {
    super(props, id as any);
  }

  public static create(props: OrderItemProps, id?: OrderItemId): OrderItem {
    return new OrderItem(props, id);
  }
}
