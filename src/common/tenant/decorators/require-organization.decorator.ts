import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { OPTIONAL_ORGANIZATION_KEY } from '@common/tenant/constants/tenant-metadata.constants';
import { TenantGuard } from '@common/tenant/guards/tenant.guard';

/**
 * Requires accepted tenant organization context for the route.
 * Overrides class-level {@link OptionalOrganization} when applied to a method.
 */
export const RequireOrganization = () =>
  applyDecorators(
    SetMetadata(OPTIONAL_ORGANIZATION_KEY, false),
    UseGuards(TenantGuard),
  );
