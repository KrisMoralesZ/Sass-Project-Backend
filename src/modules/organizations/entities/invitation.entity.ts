import { User } from '@authentication/entities/user.entity';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';
import {
  INVITATION_DEFAULT_ROLE,
  INVITATION_STATUSES,
} from '@organizations/constants/organization-invitations-v1.policy';
import type { InvitationStatus } from '@organizations/constants/organization-invitations-v1.policy';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from './organization.entity';

/**
 * Email + hashed-token invitation to join an organization (task 3.3.2).
 *
 * Rows are tenant-owned (they carry `organizationId`) but accept lookups are
 * global-with-org-FK: the invitee is not a member yet, so token resolution must
 * not be forced through `TenantGuard` membership checks.
 *
 * Raw invite tokens are never persisted; only the SHA-256 hex digest is stored.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 * @see ../../../../docs/tenant-isolation.md
 */
@Entity('organization_invitations')
@Index(['organizationId', 'email'])
export class Invitation extends TenantScopedEntity {
  /** Normalized invitee email (trimmed + lowercased by the service layer). */
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  /** Role granted on accept. Defaults to `MEMBER` when omitted.
   * Assignable roles are validated in the DTO/service layer. */
  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: INVITATION_DEFAULT_ROLE,
  })
  role!: OrganizationRole;

  /** SHA-256(token) hex digest. The raw token appears only in the invite URL. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash!: string;

  /** `pending` / `accepted` / `revoked` / `expired`. */
  @Column({
    type: 'enum',
    enum: [...INVITATION_STATUSES],
    default: INVITATION_STATUSES[0],
  })
  status!: InvitationStatus;

  /** Member who created the invite. */
  @Index()
  @Column({ type: 'uuid' })
  invitedByUserId!: string;

  /** `createdAt + TTL` (7 days). */
  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @ManyToOne(() => Organization, (organization) => organization.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy!: User;
}
