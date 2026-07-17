import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { ORGANIZATION_ID_HEADER } from './constants/tenant.constants';
import { CurrentOrganization } from './decorators/current-organization.decorator';

@ApiTags('tenant')
@Public()
@Controller({ path: 'tenant', version: '1' })
export class TenantContextController {
  @Get('context')
  @ApiOperation({ summary: 'Get the active organization context' })
  @ApiHeader({
    name: ORGANIZATION_ID_HEADER,
    required: true,
    description: 'Active organization context for the request',
  })
  getContext(@CurrentOrganization() organizationId: string) {
    return { organizationId };
  }
}
