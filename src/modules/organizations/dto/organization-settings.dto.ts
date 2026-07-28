import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { OrganizationBrandingSettingsDto } from './organization-branding-settings.dto';
import { OrganizationFeatureFlagsDto } from './organization-feature-flags.dto';

export class OrganizationSettingsDto {
  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'IANA timezone used for organization workflows.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'BCP 47 locale code for organization-facing defaults.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @ApiPropertyOptional({ type: OrganizationBrandingSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationBrandingSettingsDto)
  branding?: OrganizationBrandingSettingsDto;
}

export class OrganizationSettingsPatchDto extends OrganizationSettingsDto {
  @ApiPropertyOptional({
    type: OrganizationFeatureFlagsDto,
    description: 'Organization feature flag placeholders.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationFeatureFlagsDto)
  featureFlags?: OrganizationFeatureFlagsDto;
}
