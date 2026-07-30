import { Injectable } from '@nestjs/common';
import {
  JWT_ORGANIZATION_ID_CLAIMS,
  ORGANIZATION_ID_HEADER,
  ORGANIZATION_ID_UUID_PATTERN,
  OrganizationContextSource,
} from './constants/tenant.constants';
import {
  AuthenticatedUser,
  JwtTenantPayload,
  TenantOrganizationResolution,
} from './interfaces/tenant-context.interface';
import { RequestWithTenantContext } from './types/request-with-tenant-context.type';

@Injectable()
export class TenantContextResolver {
  /**
   * Resolves the active organization id for a request.
   *
   * Priority (v1 multi-org):
   * 1. `X-Organization-Id` header — explicit workspace switch
   * 2. `request.user.organizationId` — optional sticky claim from Auth
   * 3. JWT `organizationId` / `orgId` claim — token fallback
   */
  resolve(request: RequestWithTenantContext): string | undefined {
    return this.resolveDetailed(request).organizationId;
  }

  resolveDetailed(
    request: RequestWithTenantContext,
  ): TenantOrganizationResolution {
    const fromHeader = this.resolveFromHeader(request);
    if (fromHeader.organizationId || fromHeader.invalidCandidate) {
      return fromHeader;
    }

    const fromUser = this.resolveFromAuthenticatedUser(request.user);
    if (fromUser.organizationId || fromUser.invalidCandidate) {
      return fromUser;
    }

    return this.resolveFromAuthorizationHeader(request.headers.authorization);
  }

  private resolveFromAuthenticatedUser(
    user: AuthenticatedUser | undefined,
  ): TenantOrganizationResolution {
    return this.toResolution(user?.organizationId, 'user');
  }

  private resolveFromHeader(
    request: RequestWithTenantContext,
  ): TenantOrganizationResolution {
    const headerValue = request.headers[ORGANIZATION_ID_HEADER];
    const organizationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    return this.toResolution(organizationId, 'header');
  }

  private resolveFromAuthorizationHeader(
    authorizationHeader: string | undefined,
  ): TenantOrganizationResolution {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) {
      return {};
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return {};
    }

    for (const claim of JWT_ORGANIZATION_ID_CLAIMS) {
      const resolution = this.toResolution(payload[claim], 'jwt');
      if (resolution.organizationId || resolution.invalidCandidate) {
        return resolution;
      }
    }

    return {};
  }

  private toResolution(
    value: unknown,
    source: OrganizationContextSource,
  ): TenantOrganizationResolution {
    if (typeof value !== 'string') {
      return {};
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return {};
    }

    if (!ORGANIZATION_ID_UUID_PATTERN.test(trimmed)) {
      return {
        invalidCandidate: {
          source,
          value: trimmed,
        },
      };
    }

    return {
      organizationId: trimmed.toLowerCase(),
      source,
    };
  }

  private extractBearerToken(
    authorizationHeader: string | undefined,
  ): string | undefined {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return undefined;
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    return token.length > 0 ? token : undefined;
  }

  private decodeJwtPayload(token: string): JwtTenantPayload | undefined {
    const segments = token.split('.');
    if (segments.length < 2) {
      return undefined;
    }

    try {
      return JSON.parse(
        Buffer.from(segments[1], 'base64url').toString('utf8'),
      ) as JwtTenantPayload;
    } catch {
      return undefined;
    }
  }
}
