import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import {
  HttpExceptionFilter,
  TransformResponseInterceptor,
} from './../src/common';

jest.setTimeout(30000);

describe('Tenant guard (e2e)', () => {
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
        expect(response.body.success).toBe(true);
        expect(response.body.data.organizationId).toBeNull();
      });
  });

  it('/api/v1/tenant/context (GET) rejects requests without organization context', () => {
    return request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .expect(400)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.statusCode).toBe(400);
      });
  });

  it('/api/v1/tenant/context (GET) returns organization context from header', () => {
    return request(app.getHttpServer())
      .get('/api/v1/tenant/context')
      .set('x-organization-id', 'org-123')
      .expect(200)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.organizationId).toBe('org-123');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
