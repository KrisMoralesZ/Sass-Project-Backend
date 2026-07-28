import { AppException, ErrorCode } from '@common/errors';
import { TenantContextService } from './tenant-context.service';
import { RequestWithTenantContext } from './types/request-with-tenant-context.type';

describe('TenantContextService', () => {
  it('reads organization context from the current request', () => {
    const request = {
      tenantContext: { organizationId: 'org-123' },
    } as RequestWithTenantContext;
    const service = new TenantContextService(request);

    expect(service.getOrganizationId()).toBe('org-123');
    expect(service.hasOrganization()).toBe(true);
  });

  it('throws when organization context is required but missing', () => {
    const request = {} as RequestWithTenantContext;
    const service = new TenantContextService(request);

    let thrown: unknown;
    try {
      service.requireOrganizationId();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppException);
    expect((thrown as AppException).code).toBe(
      ErrorCode.TENANT_ORGANIZATION_REQUIRED,
    );
  });
});
