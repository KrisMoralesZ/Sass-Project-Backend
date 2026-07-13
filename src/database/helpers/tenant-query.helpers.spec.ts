import { SelectQueryBuilder } from 'typeorm';
import { applyTenantScope } from './apply-tenant-scope.helper';
import { withOrganizationScope } from './tenant-find-options.helper';

describe('withOrganizationScope', () => {
  it('returns organization filter when no where clause is provided', () => {
    expect(withOrganizationScope('org-123')).toEqual({
      organizationId: 'org-123',
    });
  });

  it('merges organization filter into a single where object', () => {
    expect(
      withOrganizationScope('org-123', {
        id: 'project-1',
      }),
    ).toEqual({
      id: 'project-1',
      organizationId: 'org-123',
    });
  });

  it('merges organization filter into each where object in an array', () => {
    expect(
      withOrganizationScope('org-123', [{ id: 'a' }, { id: 'b' }]),
    ).toEqual([
      { id: 'a', organizationId: 'org-123' },
      { id: 'b', organizationId: 'org-123' },
    ]);
  });
});

describe('applyTenantScope', () => {
  it('adds an organization filter to the query builder', () => {
    const andWhere = jest.fn().mockReturnThis();
    const queryBuilder = {
      alias: 'project',
      andWhere,
    } as unknown as SelectQueryBuilder<{ organizationId: string }>;

    const result = applyTenantScope(queryBuilder, 'org-123');

    expect(andWhere).toHaveBeenCalledWith(
      'project.organizationId = :organizationId',
      { organizationId: 'org-123' },
    );
    expect(result).toBe(queryBuilder);
  });

  it('supports a custom alias', () => {
    const andWhere = jest.fn().mockReturnThis();
    const queryBuilder = {
      alias: 'project',
      andWhere,
    } as unknown as SelectQueryBuilder<{ organizationId: string }>;

    applyTenantScope(queryBuilder, 'org-123', 'p');

    expect(andWhere).toHaveBeenCalledWith(
      'p.organizationId = :organizationId',
      {
        organizationId: 'org-123',
      },
    );
  });
});
