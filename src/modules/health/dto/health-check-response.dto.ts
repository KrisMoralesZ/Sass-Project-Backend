import { ApiProperty } from '@nestjs/swagger';

class HealthCheckComponentDto {
  @ApiProperty({ enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @ApiProperty({ example: 12 })
  responseTimeMs!: number;
}

class HealthChecksDto {
  @ApiProperty({ type: HealthCheckComponentDto })
  database!: HealthCheckComponentDto;
}

export class HealthCheckResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({ example: '2026-07-14T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 123.45 })
  uptime!: number;

  @ApiProperty({ example: '0.0.1' })
  version!: string;

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;
}

export class LivenessResponseDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: '2026-07-14T00:00:00.000Z' })
  timestamp!: string;
}
