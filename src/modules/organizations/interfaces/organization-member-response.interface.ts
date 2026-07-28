import { OrganizationRole } from '@organizations/enums/organization-role.enum';

export interface OrganizationMemberResponse {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
