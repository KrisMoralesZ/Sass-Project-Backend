import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { TenantGuard } from './tenant.guard';
import { TenantMembershipValidator } from '../tenant-membership.validator';
import { RequestWithTenantContext } from '../types/request-with-tenant-context.type';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let tenantMembershipValidator: jest.Mocked<TenantMembershipValidator>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    tenantMembershipValidator = {
      assertMembership: jest.fn(),
    } as unknown as jest.Mocked<TenantMembershipValidator>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new TenantGuard(reflector, tenantMembershipValidator);
  });

  const createContext = (request: RequestWithTenantContext) =>
    new ExecutionContextHost([request], TenantGuard, jest.fn());

  it('allows routes marked as optional organization', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const request = { headers: {} } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(tenantMembershipValidator.assertMembership).not.toHaveBeenCalled();
  });

  it('rejects requests without organization context', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const request = { headers: {} } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('validates membership when organization context is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const request = {
      headers: {},
      tenantContext: { organizationId: 'org-123' },
      user: { id: 'user-1', organizationId: 'org-123' },
    } as RequestWithTenantContext;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(tenantMembershipValidator.assertMembership).toHaveBeenCalledWith(
      request.user,
      'org-123',
    );
  });
});
