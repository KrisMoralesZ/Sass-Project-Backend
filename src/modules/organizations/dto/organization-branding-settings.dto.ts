import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class OrganizationBrandingSettingsDto {
  @ApiPropertyOptional({
    example: 'https://cdn.example.com/logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: '#2563eb', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  primaryColor?: string | null;

  @ApiPropertyOptional({ example: '#7c3aed', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  accentColor?: string | null;

  @ApiPropertyOptional({ example: 'Acme Workspace', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  appName?: string | null;
}
