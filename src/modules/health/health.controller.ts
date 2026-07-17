import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalOrganization } from '../../common/tenant';
import {
  HealthCheckResponseDto,
  LivenessResponseDto,
} from './dto/health-check-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@OptionalOrganization()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Detailed application health status' })
  @ApiResponse({ status: HttpStatus.OK, type: HealthCheckResponseDto })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    type: HealthCheckResponseDto,
  })
  async check(@Res({ passthrough: true }) response: Response) {
    const result = await this.healthService.getHealth();
    this.applyHealthStatus(response, result.status);
    return result;
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: HttpStatus.OK, type: LivenessResponseDto })
  liveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: HttpStatus.OK, type: HealthCheckResponseDto })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    type: HealthCheckResponseDto,
  })
  async readiness(@Res({ passthrough: true }) response: Response) {
    const result = await this.healthService.getReadiness();
    this.applyHealthStatus(response, result.status);
    return result;
  }

  private applyHealthStatus(
    response: Response,
    status: HealthCheckResponseDto['status'],
  ): void {
    if (status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
