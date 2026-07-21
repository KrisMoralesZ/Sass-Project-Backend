import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../../common/dto/list-query.dto';

export class ListOrganizationsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare search?: string;
}

export const ORGANIZATION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'slug',
] as const;

export type OrganizationSortField = (typeof ORGANIZATION_SORT_FIELDS)[number];
