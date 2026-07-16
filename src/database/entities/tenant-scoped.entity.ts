import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Base class for all tenant-owned tables.
 *
 * @see ../../../docs/tenant-isolation.md
 */
@Index('idx_tenant_scoped_organization_id', ['organizationId'])
export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;
}
