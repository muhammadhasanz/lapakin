import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDTO {
  @Type(() => Number)
  @IsInt({ message: 'product_id must be an integer' })
  @Min(1, { message: 'Invalid product_id' })
  product_id!: number;

  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

export default class CreateOrderDTO {
  @IsUUID('4', { message: 'customer_id must be a valid UUID' })
  @IsNotEmpty({ message: 'customer_id is required' })
  customer_id!: string;

  @IsArray({ message: 'items must be an array' })
  @ArrayMinSize(1, { message: 'items must contain at least 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDTO)
  items!: CreateOrderItemDTO[];
}
