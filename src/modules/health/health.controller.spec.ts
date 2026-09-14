import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import type {
  HealthCheckResult,
  LivenessResult,
} from './interfaces/health-check.interface';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<
    Pick<HealthService, 'getHealth' | 'getLiveness' | 'getReadiness'>
  >;

  const okResult: HealthCheckResult = {
    status: 'ok',
    timestamp: '2026-09-03T00:00:00.000Z',
    uptime: 12,
    version: '0.0.1',
    checks: {
      database: { status: 'up', responseTimeMs: 4 },
    },
  };

  beforeEach(async () => {
    healthService = {
      getHealth: jest.fn(),
      getLiveness: jest.fn(),
      getReadiness: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns detailed health without changing the status code when ok', async () => {
    healthService.getHealth.mockResolvedValue(okResult);
    const status = jest.fn();
    const response = { status } as unknown as Response;

    await expect(controller.check(response)).resolves.toEqual(okResult);
    expect(status).not.toHaveBeenCalled();
  });

  it('returns liveness from the service', () => {
    const liveness: LivenessResult = {
      status: 'ok',
      timestamp: '2026-09-03T00:00:00.000Z',
    };
    healthService.getLiveness.mockReturnValue(liveness);

    expect(controller.liveness()).toEqual(liveness);
  });

  it('sets 503 when readiness is degraded', async () => {
    const degraded: HealthCheckResult = {
      ...okResult,
      status: 'degraded',
      checks: {
        database: { status: 'down', responseTimeMs: 8 },
      },
    };
    healthService.getReadiness.mockResolvedValue(degraded);
    const status = jest.fn();
    const response = { status } as unknown as Response;

    await expect(controller.readiness(response)).resolves.toEqual(degraded);
    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
