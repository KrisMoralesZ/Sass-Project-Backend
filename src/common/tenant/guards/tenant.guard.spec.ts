import { ErrorCode } from '@common/errors';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { TenantGuard } from '@common/tenant/guards/tenant.guard';
import { TenantContextResolver } from '@common/tenant/tenant-context.resolver';
import { TenantMembershipValidator } from '@common/tenant/tenant-membership.validator';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

const ORG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MIDDLEWARE_ORG = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let tenantMembershipValidator: jest.Mocked<TenantMembershipValidator>;
  let tenantContextResolver: jest.Mocked<TenantContextResolver>;
  let reflector: jest.Mocked<Reflector>;
  let assertMembership: jest.Mock;
  let resolveDetailed: jest.Mock;

  beforeEach(() => {
    assertMembership = jest.fn();
    resolveDetailed = jest.fn();
    tenantMembershipValidator = {
      assertMembership,
    } as unknown as jest.Mocked<TenantMembershipValidator>;
    tenantContextResolver = {
      resolveDetailed,
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
      resolvedOrganizationId: ORG_ID,
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(assertMembership).not.toHaveBeenCalled();
    expect(request.tenantContext).toBeUndefined();
  });

  it('rejects requests without organization context', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolveDetailed.mockReturnValue({});
    const request = { headers: {} } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_REQUIRED,
    });
    expect(assertMembership).not.toHaveBeenCalled();
  });

  it('rejects invalid organization id candidates before membership checks', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolveDetailed.mockReturnValue({
      invalidCandidate: {
        source: 'header',
        value: 'not-a-uuid',
      },
    });
    const request = {
      headers: {},
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
    });
    expect(assertMembership).not.toHaveBeenCalled();
    expect(request.tenantContext).toBeUndefined();
  });

  it('accepts tenant context only after membership validation succeeds', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolveDetailed.mockReturnValue({
      organizationId: ORG_ID,
      source: 'header',
    });
    assertMembership.mockResolvedValue(undefined);
    const request = {
      headers: {},
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(assertMembership).toHaveBeenCalledWith(request.user, ORG_ID);
    expect(request.tenantContext).toEqual({
      organizationId: ORG_ID,
      source: 'header',
    });
  });

  it('does not accept tenant context when membership validation fails', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    resolveDetailed.mockReturnValue({
      organizationId: ORG_ID,
      source: 'header',
    });
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
    resolveDetailed.mockReturnValue({});
    assertMembership.mockResolvedValue(undefined);
    const request = {
      headers: {},
      resolvedOrganizationId: MIDDLEWARE_ORG,
      user: { id: 'user-1' },
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(assertMembership).toHaveBeenCalledWith(request.user, MIDDLEWARE_ORG);
    expect(request.tenantContext).toEqual({
      organizationId: MIDDLEWARE_ORG,
      source: 'header',
    });
  });
});
