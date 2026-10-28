import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';

/**
 * Body of `PATCH /members/:userId` (task 3.4).
 *
 * The owning organization always comes from tenant context, never from the
 * body. Last-owner and hierarchy rules are enforced by the service.
 */
export class UpdateOrganizationMemberRoleDto {
  @ApiProperty({
    enum: OrganizationRole,
    example: OrganizationRole.ADMIN,
    description: 'New role for the organization member.',
  })
  @IsEnum(OrganizationRole, {
    message: `role must be one of: ${Object.values(OrganizationRole).join(', ')}`,
  })
  role!: OrganizationRole;
}
