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

interface HealthData {
  status: string;
  database: string;
  organizationId: string | null;
  uptime: number;
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

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as ApiSuccessResponse<HealthData>;
        expect(body.success).toBe(true);
        expect(body.data.status).toBeDefined();
        expect(body.meta.version).toBe('v1');
        expect(response.headers[REQUEST_ID_HEADER]).toBeDefined();
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
