import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { OrganizationPlan } from '@organizations/enums/organization-plan.enum';
import { Organization } from './organization.entity';

describe('Organization', () => {
  it('extends BaseEntity as the tenant root record', () => {
    expect(Object.getPrototypeOf(Organization)).toBe(BaseEntity);
  });

  it('defines name, slug, plan, and settings columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === Organization)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining(['name', 'slug', 'plan', 'settings']),
    );
  });

  it('enforces unique slug lookups', () => {
    const indices = getMetadataArgsStorage()
      .indices.filter((index) => index.target === Organization)
      .flatMap((index) => index.columns ?? []);

    expect(indices).toContain('slug');
  });

  it('defaults the plan tier to FREE', () => {
    const planColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Organization && column.propertyName === 'plan',
    );

    expect(planColumn?.options.default).toBe(OrganizationPlan.FREE);
  });

  it('stores settings as jsonb', () => {
    const settingsColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Organization && column.propertyName === 'settings',
    );

    expect(settingsColumn?.options.type).toBe('jsonb');
  });
});
