import { TenantContextResolver } from './tenant-context.resolver';
import type { RequestWithTenantContext } from './types/request-with-tenant-context.type';

const HEADER_ORG = '11111111-1111-4111-8111-111111111111';
const USER_ORG = '22222222-2222-4222-8222-222222222222';
const JWT_ORG = '33333333-3333-4333-8333-333333333333';
const LEGACY_ORG = '44444444-4444-4444-8444-444444444444';

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

  it('prefers explicit header over user claim and jwt for multi-org switching', () => {
    const token = buildJwt({ organizationId: JWT_ORG });
    const request = createRequest({
      user: { id: 'user-1', organizationId: USER_ORG },
      headers: {
        'x-organization-id': HEADER_ORG,
        authorization: `Bearer ${token}`,
      },
    });

    expect(resolver.resolveDetailed(request)).toEqual({
      organizationId: HEADER_ORG,
      source: 'header',
    });
  });

  it('falls back to authenticated user organization when header is omitted', () => {
    const token = buildJwt({ organizationId: JWT_ORG });
    const request = createRequest({
      user: { id: 'user-1', organizationId: USER_ORG },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(resolver.resolve(request)).toBe(USER_ORG);
  });

  it('resolves organization from header', () => {
    const request = createRequest({
      headers: { 'x-organization-id': HEADER_ORG },
    });

    expect(resolver.resolveDetailed(request)).toEqual({
      organizationId: HEADER_ORG,
      source: 'header',
    });
  });

  it('normalizes organization ids to lowercase uuids', () => {
    const request = createRequest({
      headers: {
        'x-organization-id': HEADER_ORG.toUpperCase(),
      },
    });

    expect(resolver.resolve(request)).toBe(HEADER_ORG);
  });

  it('marks invalid header values instead of accepting them', () => {
    const request = createRequest({
      headers: { 'x-organization-id': 'not-a-uuid' },
    });

    expect(resolver.resolveDetailed(request)).toEqual({
      invalidCandidate: {
        source: 'header',
        value: 'not-a-uuid',
      },
    });
  });

  it('resolves organization from jwt organizationId claim', () => {
    const token = buildJwt({ organizationId: JWT_ORG });
    const request = createRequest({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(resolver.resolveDetailed(request)).toEqual({
      organizationId: JWT_ORG,
      source: 'jwt',
    });
  });

  it('resolves organization from jwt orgId claim', () => {
    const token = buildJwt({ orgId: LEGACY_ORG });
    const request = createRequest({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(resolver.resolve(request)).toBe(LEGACY_ORG);
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
