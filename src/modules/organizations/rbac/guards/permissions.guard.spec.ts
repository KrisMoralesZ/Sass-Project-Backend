import { ErrorCode } from '@common/errors';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { OrganizationPermission } from '@organizations/permissions/organization-permission.enum';
import { OrganizationMembershipService } from '@organizations/services/organization-membership.service';
import {
  ORGANIZATION_ID_PARAM_KEY,
  REQUIRED_MIN_ROLE_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../constants/rbac-metadata.constants';
import { PermissionsGuard } from './permissions.guard';

const ORG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_ORG_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let getActiveMembership: jest.Mock;

  beforeEach(() => {
    getActiveMembership = jest.fn();
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new PermissionsGuard(
      reflector,
      {
        getActiveMembership,
      } as unknown as OrganizationMembershipService,
    );
  });

  const createContext = (request: RequestWithTenantContext) =>
    new ExecutionContextHost([request], PermissionsGuard, jest.fn());

  const mockMetadata = (options: {
    permissions?: OrganizationPermission[];
    minRole?: OrganizationRole;
    organizationIdParam?: string;
  }) => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return options.permissions;
      }
      if (key === REQUIRED_MIN_ROLE_KEY) {
        return options.minRole;
      }
      if (key === ORGANIZATION_ID_PARAM_KEY) {
        return options.organizationIdParam;
      }
      return undefined;
    });
  };

  it('allows requests when no RBAC metadata is set', async () => {
    mockMetadata({});
    const request = { headers: {} } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(getActiveMembership).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated callers when permissions are required', async () => {
    mockMetadata({
      permissions: [OrganizationPermission.SETTINGS_UPDATE],
    });
    const request = {
      headers: {},
      tenantContext: { organizationId: ORG_ID, source: 'header' },
    } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
    });
  });

  it('rejects when organization context is missing', async () => {
    mockMetadata({
      permissions: [OrganizationPermission.SETTINGS_UPDATE],
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_REQUIRED,
    });
  });

  it('allows ADMIN for settings:update and attaches membership context', async () => {
    mockMetadata({
      permissions: [OrganizationPermission.SETTINGS_UPDATE],
    });
    getActiveMembership.mockResolvedValue({
      role: OrganizationRole.ADMIN,
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
      tenantContext: { organizationId: ORG_ID, source: 'header' },
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(getActiveMembership).toHaveBeenCalledWith('user-1', ORG_ID);
    expect(request.organizationMembership).toEqual({
      organizationId: ORG_ID,
      userId: 'user-1',
      role: OrganizationRole.ADMIN,
    });
  });

  it('rejects MEMBER for settings:update', async () => {
    mockMetadata({
      permissions: [OrganizationPermission.SETTINGS_UPDATE],
    });
    getActiveMembership.mockResolvedValue({
      role: OrganizationRole.MEMBER,
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
      tenantContext: { organizationId: ORG_ID, source: 'header' },
    } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
    });
  });

  it('allows OWNER for RequireMinRole(OWNER)', async () => {
    mockMetadata({
      minRole: OrganizationRole.OWNER,
      organizationIdParam: 'id',
    });
    getActiveMembership.mockResolvedValue({
      role: OrganizationRole.OWNER,
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
      params: { id: ORG_ID },
    } as unknown as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(getActiveMembership).toHaveBeenCalledWith('user-1', ORG_ID);
  });

  it('rejects ADMIN for RequireMinRole(OWNER)', async () => {
    mockMetadata({
      minRole: OrganizationRole.OWNER,
      organizationIdParam: 'id',
    });
    getActiveMembership.mockResolvedValue({
      role: OrganizationRole.ADMIN,
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
      params: { id: ORG_ID },
    } as unknown as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
    });
  });

  it('rejects when route param and tenant context disagree', async () => {
    mockMetadata({
      permissions: [OrganizationPermission.SETTINGS_UPDATE],
      organizationIdParam: 'id',
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
      params: { id: ORG_ID },
      tenantContext: { organizationId: OTHER_ORG_ID, source: 'header' },
    } as unknown as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
    });
    expect(getActiveMembership).not.toHaveBeenCalled();
  });

  it('rejects non-members', async () => {
    mockMetadata({
      permissions: [OrganizationPermission.SETTINGS_READ],
    });
    getActiveMembership.mockResolvedValue(null);
    const request = {
      headers: {},
      user: { id: 'user-1' },
      tenantContext: { organizationId: ORG_ID, source: 'header' },
    } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
  });
});
