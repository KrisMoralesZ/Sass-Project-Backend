import { applyDecorators, UseGuards } from '@nestjs/common';
import { TenantGuard } from '@common/tenant/guards/tenant.guard';

export const RequireOrganization = () =>
  applyDecorators(UseGuards(TenantGuard));
