import { ErrorCode } from '@common/errors';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { TenantGuard } from '@common/tenant/guards/tenant.guard';
import { TenantContextResolver } from '@common/tenant/tenant-context.resolver';
import { TenantMembershipValidator } from '@common/tenant/tenant-membership.validator';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let tenantMembershipValidator: jest.Mocked<TenantMembershipValidator>;
  let tenantContextResolver: jest.Mocked<TenantContextResolver>;
  let reflector: jest.Mocked<Reflector>;
  let assertMembership: jest.Mock;
  let resolve: jest.Mock;

  beforeEach(() => {
    assertMembership = jest.fn();
    resolve = jest.fn();
    tenantMembershipValidator = {
      assertMembership,
    } as unknown as jest.Mocked<TenantMembershipValidator>;
    tenantContextResolver = {
      resolve,
    } as unknown as jest.Mocked<TenantContextResolver>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new TenantGuard(
      reflector,
      tenantContextResolver,
      tenantMembershipValidator,
    );
  });

  const createContext = (request: RequestWithTenantContext) =>
    new ExecutionContextHost([request], TenantGuard, jest.fn());

  it('allows routes marked as optional organization without accepting context', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const request = {
      headers: {},
      resolvedOrganizationId: 'org-123',
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(assertMembership).not.toHaveBeenCalled();
    expect(request.tenantContext).toBeUndefined();
  });

  it('rejects requests without organization context', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolve.mockReturnValue(undefined);
    const request = { headers: {} } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_REQUIRED,
    });
    expect(assertMembership).not.toHaveBeenCalled();
  });

  it('accepts tenant context only after membership validation succeeds', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolve.mockReturnValue('org-123');
    assertMembership.mockResolvedValue(undefined);
    const request = {
      headers: {},
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(assertMembership).toHaveBeenCalledWith(request.user, 'org-123');
    expect(request.tenantContext).toEqual({ organizationId: 'org-123' });
  });

  it('does not accept tenant context when membership validation fails', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolve.mockReturnValue('org-forbidden');
    assertMembership.mockRejectedValue({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
    expect(request.tenantContext).toBeUndefined();
  });

  it('falls back to middleware-resolved organization id', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolve.mockReturnValue(undefined);
    assertMembership.mockResolvedValue(undefined);
    const request = {
      headers: {},
      resolvedOrganizationId: 'org-from-middleware',
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(assertMembership).toHaveBeenCalledWith(
      request.user,
      'org-from-middleware',
    );
    expect(request.tenantContext).toEqual({
      organizationId: 'org-from-middleware',
    });
  });
});
