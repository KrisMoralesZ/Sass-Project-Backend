import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';
import { ProjectStatus } from '../enums/project-status.enum';
import { Project } from './project.entity';

describe('Project', () => {
  it('extends TenantScopedEntity', () => {
    expect(Object.getPrototypeOf(Project)).toBe(TenantScopedEntity);
  });

  it('defines project ownership, status, and metadata columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === Project)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining([
        'name',
        'description',
        'ownerId',
        'status',
        'metadata',
      ]),
    );
  });

  it('defaults new projects to ACTIVE', () => {
    const statusColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Project && column.propertyName === 'status',
    );

    expect(statusColumn?.options.default).toBe(ProjectStatus.ACTIVE);
  });

  it('stores metadata as jsonb', () => {
    const metadataColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Project && column.propertyName === 'metadata',
    );

    expect(metadataColumn?.options.type).toBe('jsonb');
  });

  it('indexes owner lookups and relates the owner and organization', () => {
    const indices = getMetadataArgsStorage()
      .indices.filter((index) => index.target === Project)
      .flatMap((index) => (Array.isArray(index.columns) ? index.columns : []));
    const relations = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === Project)
      .map((relation) => relation.propertyName);

    expect(indices).toContain('ownerId');
    expect(relations).toEqual(expect.arrayContaining(['owner', 'organization']));
  });
});
