import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export default class ListOrderDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page: number = 10;

  @IsOptional()
  @IsDateString({}, { message: 'from format must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to format must be YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsUUID('4', { message: 'customer_id must be a valid UUID' })
  customer_id?: string;
}
