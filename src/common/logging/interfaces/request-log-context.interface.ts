export interface RequestLogContext {
  requestId: string;
  userId: string | null;
  organizationId: string | null;
  method: string;
  path: string;
}

export interface RequestCompletionLogContext extends RequestLogContext {
  statusCode: number;
  durationMs: number;
}
