import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { StrongPasswordProperty } from '@authentication/decorators/strong-password.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'owner@company.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @StrongPasswordProperty()
  password!: string;

  @ApiPropertyOptional({ example: 'Jane Owner' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;
}
