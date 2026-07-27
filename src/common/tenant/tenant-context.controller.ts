import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ORGANIZATION_ID_HEADER } from './constants/tenant.constants';
import { CurrentOrganization } from './decorators/current-organization.decorator';

@ApiTags('tenant')
@ApiBearerAuth()
@SkipThrottle()
@Controller({ path: 'tenant', version: '1' })
export class TenantContextController {
  @Get('context')
  @ApiOperation({
    summary: 'Get the active organization context',
    description:
      'Returns the organization context only after the caller is authenticated and confirmed as an active member.',
  })
  @ApiHeader({
    name: ORGANIZATION_ID_HEADER,
    required: true,
    description: 'Active organization context for the request',
  })
  getContext(@CurrentOrganization() organizationId: string) {
    return { organizationId };
  }
}
