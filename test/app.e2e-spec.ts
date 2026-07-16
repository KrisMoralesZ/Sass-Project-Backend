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
  ApiSuccessResponse,
  HttpExceptionFilter,
  REQUEST_ID_HEADER,
  TransformResponseInterceptor,
} from './../src/common';

interface HealthCheckData {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTimeMs: number;
    };
  };
}

interface LivenessData {
  status: 'ok';
  timestamp: string;
}

jest.setTimeout(30000);

describe('Health (e2e)', () => {
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

  it('/api/v1/health (GET) returns detailed health status', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<HealthCheckData>;
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ok');
        expect(body.data.checks.database.status).toBe('up');
        expect(body.data.version).toBeDefined();
        expect(body.meta.version).toBe('v1');
        expect(response.headers[REQUEST_ID_HEADER]).toBeDefined();
      });
  });

  it('/api/v1/health/live (GET) returns liveness status', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<LivenessData>;
        expect(body.data.status).toBe('ok');
        expect(body.data.timestamp).toBeDefined();
      });
  });

  it('/api/v1/health/ready (GET) returns readiness status', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<HealthCheckData>;
        expect(body.data.status).toBe('ok');
        expect(body.data.checks.database.status).toBe('up');
      });
  });

  it('/api/v1/health (GET) echoes provided request id', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .set(REQUEST_ID_HEADER, 'client-request-id')
      .expect(200)
      .expect((response) => {
        expect(response.headers[REQUEST_ID_HEADER]).toBe('client-request-id');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
