import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@app/app.module';
import {
  ApiErrorResponse,
  ApiSuccessResponse,
  ErrorCode,
  HttpExceptionFilter,
  TransformResponseInterceptor,
} from '@common/index';

interface TenantContextData {
  organizationId: string;
}

interface HealthCheckData {
  status: 'ok' | 'degraded';
  checks: {
    database: {
      status: 'up' | 'down';
    };
  };
}

interface AuthRegisterData {
  user: { id: string; email: string };
  tokens: { accessToken: string };
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
}

jest.setTimeout(30000);

describe('Tenant membership validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformResponseInterceptor());

    await app.init();
  });

  it('/api/v1/health (GET) allows requests without organization context', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<HealthCheckData>;
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ok');
        expect(body.data.checks.database.status).toBe('up');
      });
  });

  it('/api/v1/tenant/context (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('x-organization-id', 'org-123')
      .expect(401);
  });

  it('/api/v1/tenant/context (GET) rejects authenticated requests without organization context', async () => {
    const accessToken = await registerAndGetAccessToken('tenant-required');

    return request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400)
      .expect((response) => {
        const body = response.body as ApiErrorResponse;
        expect(body.success).toBe(false);
        expect(body.error.statusCode).toBe(400);
        expect(body.error.code).toBe(ErrorCode.TENANT_ORGANIZATION_REQUIRED);
      });
  });

  it('/api/v1/tenant/context (GET) accepts context only for active memberships', async () => {
    const accessToken = await registerAndGetAccessToken('tenant-member');
    const organization = await createOrganization(
      accessToken,
      'Member Workspace',
      `member-workspace-${Date.now()}`,
    );

    await request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', organization.id)
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<TenantContextData>;
        expect(body.success).toBe(true);
        expect(body.data.organizationId).toBe(organization.id);
      });
  });

  it('/api/v1/tenant/context (GET) rejects organization context the user does not belong to', async () => {
    const ownerToken = await registerAndGetAccessToken('tenant-owner');
    const outsiderToken = await registerAndGetAccessToken('tenant-outsider');
    const organization = await createOrganization(
      ownerToken,
      'Private Workspace',
      `private-workspace-${Date.now()}`,
    );

    await request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .set('x-organization-id', organization.id)
      .expect(403)
      .expect((response) => {
        const body = response.body as ApiErrorResponse;
        expect(body.success).toBe(false);
        expect(body.error.statusCode).toBe(403);
        expect(body.error.code).toBe(ErrorCode.TENANT_ORGANIZATION_FORBIDDEN);
      });
  });

  it('/api/v1/tenant/context (GET) rejects non-uuid organization ids', async () => {
    const accessToken = await registerAndGetAccessToken('tenant-invalid-org');

    await request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', 'not-a-uuid')
      .expect(400)
      .expect((response) => {
        const body = response.body as ApiErrorResponse;
        expect(body.success).toBe(false);
        expect(body.error.statusCode).toBe(400);
        expect(body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
      });
  });

  it('/api/v1/tenant/context (GET) switches active organization via header', async () => {
    const accessToken = await registerAndGetAccessToken('tenant-switch');
    const firstOrganization = await createOrganization(
      accessToken,
      'First Workspace',
      `first-workspace-${Date.now()}`,
    );
    const secondOrganization = await createOrganization(
      accessToken,
      'Second Workspace',
      `second-workspace-${Date.now()}`,
    );

    await request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', firstOrganization.id)
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<TenantContextData>;
        expect(body.data.organizationId).toBe(firstOrganization.id);
      });

    await request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-organization-id', secondOrganization.id)
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<TenantContextData>;
        expect(body.data.organizationId).toBe(secondOrganization.id);
      });
  });

  afterEach(async () => {
    await app.close();
  });

  async function registerAndGetAccessToken(label: string): Promise<string> {
    const email = `${label}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@example.com`;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'Password1',
        displayName: label,
      })
      .expect(201);

    const body = response.body as ApiSuccessResponse<AuthRegisterData>;
    return body.data.tokens.accessToken;
  }

  async function createOrganization(
    accessToken: string,
    name: string,
    slug: string,
  ): Promise<OrganizationData> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, slug })
      .expect(201);

    const body = response.body as ApiSuccessResponse<OrganizationData>;
    return body.data;
  }
});
