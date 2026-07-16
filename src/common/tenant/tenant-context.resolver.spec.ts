import { TenantContextResolver } from './tenant-context.resolver';
import type { RequestWithTenantContext } from './types/request-with-tenant-context.type';

describe('TenantContextResolver', () => {
  let resolver: TenantContextResolver;

  beforeEach(() => {
    resolver = new TenantContextResolver();
  });

  const createRequest = (
    overrides: Partial<RequestWithTenantContext> = {},
  ): RequestWithTenantContext =>
    ({
      headers: {},
      ...overrides,
    }) as RequestWithTenantContext;

  it('prefers authenticated user organization over header and jwt', () => {
    const token = buildJwt({ organizationId: 'jwt-org' });
    const request = createRequest({
      user: { id: 'user-1', organizationId: 'user-org' },
      headers: {
        'x-organization-id': 'header-org',
        authorization: `Bearer ${token}`,
      },
    });

    expect(resolver.resolve(request)).toBe('user-org');
  });

  it('resolves organization from header', () => {
    const request = createRequest({
      headers: { 'x-organization-id': 'header-org' },
    });

    expect(resolver.resolve(request)).toBe('header-org');
  });

  it('resolves organization from jwt organizationId claim', () => {
    const token = buildJwt({ organizationId: 'jwt-org' });
    const request = createRequest({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(resolver.resolve(request)).toBe('jwt-org');
  });

  it('resolves organization from jwt orgId claim', () => {
    const token = buildJwt({ orgId: 'legacy-org' });
    const request = createRequest({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(resolver.resolve(request)).toBe('legacy-org');
  });

  it('returns undefined when no tenant source is present', () => {
    const request = createRequest();

    expect(resolver.resolve(request)).toBeUndefined();
  });
});

function buildJwt(payload: Record<string, string>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${header}.${body}.signature`;
}
