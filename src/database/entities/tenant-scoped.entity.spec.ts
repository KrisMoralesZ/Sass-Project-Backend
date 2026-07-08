import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantScopedEntity } from './tenant-scoped.entity';

describe('BaseEntity', () => {
  it('defines id, timestamps, and soft delete columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === BaseEntity)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining(['id', 'createdAt', 'updatedAt', 'deletedAt']),
    );
  });
});

describe('TenantScopedEntity', () => {
  it('extends BaseEntity', () => {
    expect(Object.getPrototypeOf(TenantScopedEntity)).toBe(BaseEntity);
  });

  it('indexes organizationId for tenant-scoped queries', () => {
    const indices = getMetadataArgsStorage()
      .indices.filter((index) => index.target === TenantScopedEntity)
      .flatMap((index) => index.columns ?? []);

    expect(indices).toContain('organizationId');
  });

  it('defines organizationId as a uuid column', () => {
    const organizationIdColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === TenantScopedEntity &&
        column.propertyName === 'organizationId',
    );

    expect(organizationIdColumn?.options.type).toBe('uuid');
  });
});
