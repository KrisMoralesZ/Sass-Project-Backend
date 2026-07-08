import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Index('idx_tenant_scoped_organization_id', ['organizationId'])
export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;
}
