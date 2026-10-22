import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Base class for all tenant-owned tables.
 *
 * The `organizationId` index is intentionally unnamed so TypeORM derives a
 * per-table name; Postgres index names are schema-global, so a fixed name
 * collides as soon as a second tenant-scoped table exists.
 *
 * @see ../../../docs/tenant-isolation.md
 */
@Index(['organizationId'])
export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;
}
