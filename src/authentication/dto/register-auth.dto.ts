import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from './password-strength.decorator';

export class RegisterAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;
}
