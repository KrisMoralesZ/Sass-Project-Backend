import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { OrganizationMember } from './organization-member.entity';

describe('OrganizationMember', () => {
  it('extends TenantScopedEntity', () => {
    expect(Object.getPrototypeOf(OrganizationMember)).toBe(TenantScopedEntity);
  });

  it('defines userId and role columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === OrganizationMember)
      .map((column) => column.propertyName);

    expect(columns).toEqual(expect.arrayContaining(['userId', 'role']));
  });

  it('enforces unique membership per organization and user', () => {
    const indices = getMetadataArgsStorage()
      .indices.filter((index) => index.target === OrganizationMember)
      .map((index) => index.columns);

    expect(indices).toContainEqual(['organizationId', 'userId']);
  });

  it('defaults the role to MEMBER', () => {
    const roleColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === OrganizationMember && column.propertyName === 'role',
    );

    expect(roleColumn?.options.default).toBe(OrganizationRole.MEMBER);
  });
});
