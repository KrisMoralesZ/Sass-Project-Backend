import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrganizationPlan } from '../enums/organization-plan.enum';
import { ORGANIZATION_SLUG_PATTERN } from '../utils/organization-slug.util';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'acme-corp',
    description:
      'URL-friendly identifier. Generated from the name when omitted.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(ORGANIZATION_SLUG_PATTERN, {
    message: 'slug must contain lowercase letters, numbers, and hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    enum: OrganizationPlan,
    default: OrganizationPlan.FREE,
  })
  @IsOptional()
  @IsEnum(OrganizationPlan)
  plan?: OrganizationPlan;
}
