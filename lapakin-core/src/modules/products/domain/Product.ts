import { Entity } from '@/shared/index.ts';
import type { ProductId } from './ProductId.ts';

export interface ProductProps {
  productCode: string;
  productName: string;
  stock: number;
  price: string; // numeric string e.g. "12000.00"
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Product extends Entity<ProductProps> {
  declare readonly _id: any;

  get id(): number {
    return this._id ? Number(this._id.toValue()) : 0;
  }

  get productCode(): string {
    return this.props.productCode;
  }

  get productName(): string {
    return this.props.productName;
  }

  get stock(): number {
    return this.props.stock;
  }

  get price(): string {
    return this.props.price;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  private constructor(props: ProductProps, id?: ProductId) {
    super(props, id as any);
  }

  public static create(props: ProductProps, id?: ProductId): Product {
    return new Product(props, id);
  }
}
