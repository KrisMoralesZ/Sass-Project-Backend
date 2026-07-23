import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto';
import { OrganizationSettingsPatchDto } from './organization-settings.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationSettingsPatchDto)
  settings?: OrganizationSettingsPatchDto;
}
