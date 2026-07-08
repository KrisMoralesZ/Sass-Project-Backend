import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentOrganization,
  OptionalOrganization,
  ORGANIZATION_ID_HEADER,
} from '../../common/tenant';
import { HealthService } from './health.service';

@ApiTags('health')
@OptionalOrganization()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Application health check' })
  @ApiHeader({
    name: ORGANIZATION_ID_HEADER,
    required: false,
    description: 'Active organization context for the request',
  })
  check(@CurrentOrganization() organizationId?: string) {
    return this.healthService.check(organizationId);
  }
}
