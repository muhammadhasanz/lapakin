import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export default class UpdateProductDTO {
  @IsString()
  @IsNotEmpty({ message: 'Product code is required' })
  @MaxLength(20)
  product_code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MaxLength(150)
  product_name!: string;

  @Type(() => Number)
  @IsInt({ message: 'Stock must be an integer' })
  @Min(0, { message: 'Stock cannot be negative' })
  @Max(2_000_000_000)
  stock!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be greater than 0' })
  @Max(9_999_999_999.99)
  price!: number;
}
