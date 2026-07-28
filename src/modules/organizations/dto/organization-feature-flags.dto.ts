import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { OrganizationFeatureFlag } from '../interfaces/organization-feature-flags.interface';

export class OrganizationFeatureFlagsDto {
  @ApiPropertyOptional({
    description: 'Enable beta board workflows for the organization.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  [OrganizationFeatureFlag.BETA_BOARDS]?: boolean;

  @ApiPropertyOptional({
    description: 'Enable advanced reporting features for the organization.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  [OrganizationFeatureFlag.ADVANCED_REPORTS]?: boolean;

  @ApiPropertyOptional({
    description: 'Enable member invitation flows for the organization.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  [OrganizationFeatureFlag.MEMBER_INVITES]?: boolean;

  @ApiPropertyOptional({
    description: 'Enable custom branding controls for the organization.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  [OrganizationFeatureFlag.CUSTOM_BRANDING]?: boolean;
}
