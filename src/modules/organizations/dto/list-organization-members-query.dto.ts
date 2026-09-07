import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '@common/dto/list-query.dto';

export class ListOrganizationMembersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare search?: string;
}

export const ORGANIZATION_MEMBER_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'role',
] as const;

export type OrganizationMemberSortField =
  (typeof ORGANIZATION_MEMBER_SORT_FIELDS)[number];
