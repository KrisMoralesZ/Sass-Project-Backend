export type ComponentStatus = 'up' | 'down';

export type HealthStatus = 'ok' | 'degraded';

export interface HealthCheckComponent {
  status: ComponentStatus;
  responseTimeMs: number;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheckComponent;
  };
}

export interface LivenessResult {
  status: 'ok';
  timestamp: string;
}
