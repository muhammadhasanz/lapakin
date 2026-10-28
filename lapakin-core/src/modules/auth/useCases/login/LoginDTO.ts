import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export default class LoginDTO {
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(150)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MaxLength(200)
  password!: string;
}
