import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';
import {
  INVITATION_DEFAULT_ROLE,
  INVITATION_STATUSES,
} from '@organizations/constants/organization-invitations-v1.policy';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { Invitation } from './invitation.entity';

describe('Invitation', () => {
  it('extends TenantScopedEntity', () => {
    expect(Object.getPrototypeOf(Invitation)).toBe(TenantScopedEntity);
  });

  it('defines the invitation columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === Invitation)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining([
        'email',
        'role',
        'tokenHash',
        'status',
        'invitedByUserId',
        'expiresAt',
      ]),
    );
  });

  it('indexes the (organizationId, email) lookup pair', () => {
    const indices = getMetadataArgsStorage()
      .indices.filter((index) => index.target === Invitation)
      .map((index) => index.columns);

    expect(indices).toContainEqual(['organizationId', 'email']);
  });

  it('defaults the granted role to MEMBER', () => {
    const roleColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Invitation && column.propertyName === 'role',
    );

    expect(roleColumn?.options.type).toBe('enum');
    expect(roleColumn?.options.enum).toBe(OrganizationRole);
    expect(roleColumn?.options.default).toBe(INVITATION_DEFAULT_ROLE);
  });

  it('stores invitation lifecycle statuses with a pending default', () => {
    const statusColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Invitation && column.propertyName === 'status',
    );

    expect(statusColumn?.options.type).toBe('enum');
    expect(statusColumn?.options.enum).toEqual([...INVITATION_STATUSES]);
    expect(statusColumn?.options.default).toBe(INVITATION_STATUSES[0]);
  });

  it('persists only a unique SHA-256 token hash, never the raw token', () => {
    const tokenHashColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Invitation && column.propertyName === 'tokenHash',
    );
    const tokenHashIndex = getMetadataArgsStorage()
      .indices.filter((index) => index.target === Invitation)
      .find(
        (index) =>
          Array.isArray(index.columns) &&
          index.columns.length === 1 &&
          index.columns[0] === 'tokenHash',
      );

    expect(tokenHashColumn?.options.length).toBe(64);
    expect(tokenHashIndex?.unique).toBe(true);
  });

  it('links the owning organization and the inviting user', () => {
    const relations = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === Invitation)
      .map((relation) => relation.propertyName);

    expect(relations).toEqual(
      expect.arrayContaining(['organization', 'invitedBy']),
    );
  });
});
