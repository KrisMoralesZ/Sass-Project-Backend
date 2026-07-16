import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  HealthCheckComponent,
  HealthCheckResult,
  HealthStatus,
  LivenessResult,
} from './interfaces/health-check.interface';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  getLiveness(): LivenessResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<HealthCheckResult> {
    return this.buildHealthCheckResult();
  }

  async getHealth(): Promise<HealthCheckResult> {
    return this.buildHealthCheckResult();
  }

  private async buildHealthCheckResult(): Promise<HealthCheckResult> {
    const database = await this.checkDatabase();
    const status: HealthStatus = database.status === 'up' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.configService.get<string>('appVersion', '0.0.0'),
      checks: {
        database,
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheckComponent> {
    const startedAt = Date.now();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'up',
        responseTimeMs: Date.now() - startedAt,
      };
    } catch {
      return {
        status: 'down',
        responseTimeMs: Date.now() - startedAt,
      };
    }
  }
}
