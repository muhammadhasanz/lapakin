import type { CustomerRow } from '@/infrastructure/database/drizzle/schema.ts';
import { Mapper, UniqueId } from '@/shared/index.ts';
import { Customer, type Gender } from '../domain/Customer.ts';
import { CustomerId } from '../domain/CustomerId.ts';

export class CustomerMapper extends Mapper<Customer> {
  public static toDomain(raw: CustomerRow): Customer {
    return Customer.create(
      {
        customerName: raw.customerName,
        customerAddress: raw.customerAddress,
        gender: raw.gender as Gender,
        birthDate: raw.birthDate,
        phone: raw.phone,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new CustomerId(raw.id),
    );
  }

  public static toPersistence(customer: Customer): {
    id: string;
    customerName: string;
    customerAddress: string;
    gender: 'Pria' | 'Wanita';
    birthDate: string;
    phone?: string | null;
  } {
    return {
      id: customer.id,
      customerName: customer.customerName,
      customerAddress: customer.customerAddress,
      gender: customer.gender,
      birthDate: customer.birthDate,
      phone: customer.phone,
    };
  }

  public static toDTO(customer: Customer) {
    return {
      id: customer.id,
      customer_name: customer.customerName,
      customer_address: customer.customerAddress,
      gender: customer.gender,
      birth_date: customer.birthDate,
      phone: customer.phone ?? null,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    };
  }
}
