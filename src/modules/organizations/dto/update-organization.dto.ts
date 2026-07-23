import { PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
