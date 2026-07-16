import { applyDecorators, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../guards/tenant.guard';

export const RequireOrganization = () =>
  applyDecorators(UseGuards(TenantGuard));
