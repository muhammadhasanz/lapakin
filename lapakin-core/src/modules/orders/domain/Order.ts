import { Entity } from '@/shared/index.ts';
import type { OrderId } from './OrderId.ts';
import type { OrderItem } from './OrderItem.ts';

export interface OrderProps {
  orderNumber: string;
  customerId: string;
  customerName?: string;
  createdBy: string;
  createdByName?: string;
  orderDate?: Date;
  totalAmount: string;
  items?: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order extends Entity<OrderProps> {
  declare readonly _id: any;

  get id(): number {
    return this._id ? Number(this._id.toValue()) : 0;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get customerName(): string | undefined {
    return this.props.customerName;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdByName(): string | undefined {
    return this.props.createdByName;
  }

  get orderDate(): Date | undefined {
    return this.props.orderDate;
  }

  get totalAmount(): string {
    return this.props.totalAmount;
  }

  get items(): OrderItem[] {
    return this.props.items ?? [];
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private constructor(props: OrderProps, id?: OrderId) {
    super(props, id as any);
  }

  public static create(props: OrderProps, id?: OrderId): Order {
    return new Order(props, id);
  }
}
