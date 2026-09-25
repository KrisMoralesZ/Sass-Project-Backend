import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';
import {
  INVITATION_ASSIGNABLE_ROLES,
  INVITATION_DEFAULT_ROLE,
  type InvitationAssignableRole,
} from '@organizations/constants/organization-invitations-v1.policy';

/**
 * Body of `POST /invites` (task 3.3.3).
 *
 * The owning organization always comes from tenant context, never from the
 * body. Email is validated here and normalized (trim + lowercase) by the
 * service layer before persistence.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 */
export class CreateInvitationDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    enum: [...INVITATION_ASSIGNABLE_ROLES],
    default: INVITATION_DEFAULT_ROLE,
    description:
      'Role granted when the invite is accepted. Defaults to MEMBER.',
  })
  @IsOptional()
  @IsIn([...INVITATION_ASSIGNABLE_ROLES] as string[], {
    message: `role must be one of: ${INVITATION_ASSIGNABLE_ROLES.join(', ')}`,
  })
  role: InvitationAssignableRole = INVITATION_DEFAULT_ROLE;
}
