import { Request } from 'express';
import type { RequestWithTenantContext } from '../../tenant/types/request-with-tenant-context.type';
import { RequestLogContext } from '../interfaces/request-log-context.interface';
import {
  isRequestWithLogging,
  RequestWithFullContext,
} from '../types/request-with-logging.type';

export function getRequestLogContext(request: Request): RequestLogContext {
  const contextualRequest = request as RequestWithFullContext;

  return {
    requestId: isRequestWithLogging(request) ? request.requestId : 'unknown',
    userId: contextualRequest.user?.id ?? null,
    organizationId: contextualRequest.tenantContext?.organizationId ?? null,
    method: request.method,
    path: request.url,
  };
}

export function formatRequestLogContext(context: RequestLogContext): string {
  return JSON.stringify(context);
}

export function getOrganizationIdFromRequest(
  request: RequestWithTenantContext,
): string | null {
  return request.tenantContext?.organizationId ?? null;
}

export function getUserIdFromRequest(
  request: RequestWithTenantContext,
): string | null {
  return request.user?.id ?? null;
}
