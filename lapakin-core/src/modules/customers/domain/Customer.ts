import { Entity, type UniqueId } from '@/shared/index.ts';
import { CustomerId } from './CustomerId.ts';

export type Gender = 'Pria' | 'Wanita';

export interface CustomerProps {
  customerName: string;
  customerAddress: string;
  gender: Gender;
  birthDate: string; // 'YYYY-MM-DD'
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Customer extends Entity<CustomerProps> {
  get id(): string {
    return this._id.toString();
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get customerAddress(): string {
    return this.props.customerAddress;
  }

  get gender(): Gender {
    return this.props.gender;
  }

  get birthDate(): string {
    return this.props.birthDate;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
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

  private constructor(props: CustomerProps, id?: UniqueId) {
    super(props, id);
  }

  public static create(props: CustomerProps, id?: UniqueId): Customer {
    return new Customer(props, id ?? new CustomerId());
  }
}
