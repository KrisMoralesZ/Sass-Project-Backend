import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { OrganizationPlan } from '@organizations/enums/organization-plan.enum';

/**
 * Root tenant record. Other modules reference this entity via `organizationId`.
 *
 * Organization is the tenant boundary itself, so it extends {@link BaseEntity}
 * rather than {@link TenantScopedEntity}.
 *
 * @see ../../../../docs/tenant-isolation.md
 */
@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({
    type: 'enum',
    enum: OrganizationPlan,
    default: OrganizationPlan.FREE,
  })
  plan!: OrganizationPlan;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;
}
