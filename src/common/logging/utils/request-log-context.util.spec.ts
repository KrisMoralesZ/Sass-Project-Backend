import { Request } from 'express';
import { RequestWithFullContext } from '@common/logging/types/request-with-logging.type';
import { getRequestLogContext } from './request-log-context.util';

describe('getRequestLogContext', () => {
  it('extracts request, user, and organization context', () => {
    const request = {
      requestId: 'req-123',
      method: 'GET',
      url: '/api/v1/projects',
      user: { id: 'user-1' },
      tenantContext: { organizationId: 'org-123' },
    } as RequestWithFullContext;

    expect(getRequestLogContext(request)).toEqual({
      requestId: 'req-123',
      userId: 'user-1',
      organizationId: 'org-123',
      method: 'GET',
      path: '/api/v1/projects',
    });
  });

  it('falls back when optional context is missing', () => {
    const request = {
      method: 'POST',
      url: '/api/v1/auth/login',
    } as Request;

    expect(getRequestLogContext(request)).toEqual({
      requestId: 'unknown',
      userId: null,
      organizationId: null,
      method: 'POST',
      path: '/api/v1/auth/login',
    });
  });
});
