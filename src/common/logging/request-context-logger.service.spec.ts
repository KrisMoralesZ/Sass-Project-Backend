import { RequestContextLogger } from './request-context-logger.service';
import { RequestWithFullContext } from './types/request-with-logging.type';

describe('RequestContextLogger', () => {
  it('logs messages with request context', () => {
    const request = {
      requestId: 'req-123',
      method: 'GET',
      url: '/api/v1/projects',
      user: { id: 'user-1' },
      tenantContext: { organizationId: 'org-123' },
    } as RequestWithFullContext;
    const logger = new RequestContextLogger(request);
    const logSpy = jest
      .spyOn(logger['logger'], 'log')
      .mockImplementation(() => undefined);

    logger.log('Project listed', { count: 2 });

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        requestId: 'req-123',
        userId: 'user-1',
        organizationId: 'org-123',
        method: 'GET',
        path: '/api/v1/projects',
        message: 'Project listed',
        count: 2,
      }),
    );
  });
});
