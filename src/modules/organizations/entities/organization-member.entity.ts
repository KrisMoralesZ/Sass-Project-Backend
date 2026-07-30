import { User } from '@authentication/entities/user.entity';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from './organization.entity';

/**
 * Join record linking global users to tenant organizations.
 *
 * v1 policy: users may belong to multiple organizations; each request selects
 * one active organization via tenant context.
 *
 * @see ../../../../docs/organization-membership-v1.md
 * @see ../../../../docs/tenant-isolation.md
 */
@Entity('organization_members')
@Index(['organizationId', 'userId'], { unique: true })
export class OrganizationMember extends TenantScopedEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Organization, (organization) => organization.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  role!: OrganizationRole;
}
