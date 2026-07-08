import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns degraded when the database query fails', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('db down')),
    };

    const service = new HealthService(dataSource as any);
    const result = await service.check();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'degraded',
        database: 'down',
      }),
    );
    expect(result.uptime).toBeGreaterThan(0);
  });
});
