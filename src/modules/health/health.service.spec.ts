import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let dataSource: { query: jest.Mock };
  let configService: Pick<ConfigService, 'get'>;
  let service: HealthService;

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('0.0.1'),
    };
    service = new HealthService(
      dataSource as unknown as DataSource,
      configService as ConfigService,
    );
  });

  it('returns liveness without checking dependencies', () => {
    expect(service.getLiveness()).toEqual({
      status: 'ok',
      timestamp: expect.any(String) as string,
    });
  });

  it('returns ok when the database is reachable', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.getHealth();

    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.0.1');
    expect(result.checks.database).toEqual({
      status: 'up',
      responseTimeMs: expect.any(Number) as number,
    });
  });

  it('returns degraded when the database query fails', async () => {
    dataSource.query.mockRejectedValue(new Error('db down'));

    const result = await service.getReadiness();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'degraded',
        checks: {
          database: {
            status: 'down',
            responseTimeMs: expect.any(Number) as number,
          },
        },
      }),
    );
    expect(result.uptime).toBeGreaterThan(0);
  });
});
