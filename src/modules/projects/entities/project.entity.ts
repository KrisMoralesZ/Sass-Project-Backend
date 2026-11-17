import { User } from '@authentication/entities/user.entity';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';
import { Organization } from '@organizations/entities/organization.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ProjectStatus } from '../enums/project-status.enum';
import type { ProjectMetadata } from '../interfaces/project-metadata.interface';

@Entity('projects')
export class Project extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status!: ProjectStatus;

  @Column({ type: 'jsonb', default: {} })
  metadata!: ProjectMetadata;
}
