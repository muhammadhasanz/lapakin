import type { ProductRow } from '@/infrastructure/database/drizzle/schema.ts';
import { Mapper, numberToDecimal, toNumber } from '@/shared/index.ts';
import { Product } from '../domain/Product.ts';
import { ProductId } from '../domain/ProductId.ts';

export class ProductMapper extends Mapper<Product> {
  public static toDomain(raw: ProductRow): Product {
    return Product.create(
      {
        productCode: raw.productCode,
        productName: raw.productName,
        stock: raw.stock,
        price: raw.price,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new ProductId(raw.id),
    );
  }

  public static toPersistence(product: Product): {
    id?: number;
    productCode: string;
    productName: string;
    stock: number;
    price: string;
  } {
    return {
      ...(product.id > 0 ? { id: product.id } : {}),
      productCode: product.productCode,
      productName: product.productName,
      stock: product.stock,
      price: product.price,
    };
  }

  public static toDTO(product: Product) {
    return {
      id: product.id,
      product_code: product.productCode,
      product_name: product.productName,
      stock: product.stock,
      price: toNumber(product.price),
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    };
  }
}
