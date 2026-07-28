import { Request } from 'express';
import type { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

export type RequestWithLogging = Request & {
  requestId: string;
};

export type RequestWithFullContext = RequestWithLogging &
  RequestWithTenantContext;

export function isRequestWithLogging(
  request: Request,
): request is RequestWithLogging {
  return typeof (request as RequestWithLogging).requestId === 'string';
}
