import { IsIn, IsOptional } from 'class-validator';
import { ListQueryDto } from '@common/dto/list-query.dto';
import {
  INVITATION_STATUSES,
  type InvitationStatus,
} from '@organizations/constants/organization-invitations-v1.policy';

export class ListInvitationsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn([...INVITATION_STATUSES] as string[])
  status?: InvitationStatus;
}

export const INVITATION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'email',
  'role',
  'status',
] as const;

export type InvitationSortField = (typeof INVITATION_SORT_FIELDS)[number];
