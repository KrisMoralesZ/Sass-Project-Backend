import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException, ErrorCode } from '@common/errors';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';
import {
  hasAtLeastOrganizationRole,
  OrganizationRole,
} from '@organizations/enums/organization-role.enum';
import { OrganizationPermission } from '@organizations/permissions/organization-permission.enum';
import { roleHasEveryPermission } from '@organizations/permissions/organization-permission.matrix';
import { OrganizationMembershipService } from '@organizations/services/organization-membership.service';
import {
  ORGANIZATION_ID_PARAM_KEY,
  REQUIRED_MIN_ROLE_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../constants/rbac-metadata.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly organizationMembershipService: OrganizationMembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<OrganizationPermission[]>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const minimumRole = this.reflector.getAllAndOverride<OrganizationRole>(
      REQUIRED_MIN_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions.length === 0 && !minimumRole) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    const userId = request.user?.id;
    if (!userId) {
      throw AppException.unauthorized('Authentication is required');
    }

    const organizationId = this.resolveOrganizationId(context, request);

    const membership =
      await this.organizationMembershipService.getActiveMembership(
        userId,
        organizationId,
      );

    if (!membership) {
      throw AppException.forbidden(
        ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
        'You do not have access to this organization.',
      );
    }

    request.organizationMembership = {
      organizationId,
      userId,
      role: membership.role,
    };

    if (
      minimumRole &&
      !hasAtLeastOrganizationRole(membership.role, minimumRole)
    ) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        `Requires at least the ${minimumRole} role.`,
      );
    }

    if (
      requiredPermissions.length > 0 &&
      !roleHasEveryPermission(membership.role, requiredPermissions)
    ) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        `Missing required permission(s): ${requiredPermissions.join(', ')}.`,
      );
    }

    return true;
  }

  private resolveOrganizationId(
    context: ExecutionContext,
    request: RequestWithTenantContext,
  ): string {
    const organizationIdParam = this.reflector.getAllAndOverride<string>(
      ORGANIZATION_ID_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );

    const paramOrganizationId = organizationIdParam
      ? this.readRouteParam(request, organizationIdParam)
      : undefined;

    const tenantOrganizationId = request.tenantContext?.organizationId;

    if (
      paramOrganizationId &&
      tenantOrganizationId &&
      paramOrganizationId !== tenantOrganizationId
    ) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'Organization route parameter does not match the active organization context.',
      );
    }

    const organizationId = tenantOrganizationId ?? paramOrganizationId;

    if (!organizationId) {
      throw AppException.badRequest(
        ErrorCode.TENANT_ORGANIZATION_REQUIRED,
        'Organization context is required for permission checks.',
      );
    }

    return organizationId;
  }

  private readRouteParam(
    request: RequestWithTenantContext,
    paramName: string,
  ): string | undefined {
    const value = request.params?.[paramName];
    if (typeof value !== 'string' || value.trim().length === 0) {
      return undefined;
    }

    return value;
  }
}
