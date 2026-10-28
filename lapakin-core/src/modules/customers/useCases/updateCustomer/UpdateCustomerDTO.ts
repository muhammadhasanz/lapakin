import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export default class UpdateCustomerDTO {
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  @MaxLength(150)
  customer_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Customer address is required' })
  @MaxLength(255)
  customer_address!: string;

  @IsString()
  @IsIn(['Pria', 'Wanita'], { message: 'Gender must be Pria or Wanita' })
  gender!: 'Pria' | 'Wanita';

  @IsDateString({}, { message: 'Birth date must be in YYYY-MM-DD format' })
  birth_date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
