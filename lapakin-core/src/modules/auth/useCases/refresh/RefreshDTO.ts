import { IsNotEmpty, IsString } from 'class-validator';

export default class RefreshDTO {
  @IsString()
  @IsNotEmpty({ message: 'refresh_token cannot be empty' })
  refresh_token!: string;
}
