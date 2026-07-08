import { Injectable } from '@nestjs/common';
import {
  JWT_ORGANIZATION_ID_CLAIMS,
  ORGANIZATION_ID_HEADER,
} from './constants/tenant.constants';
import {
  AuthenticatedUser,
  JwtTenantPayload,
} from './interfaces/tenant-context.interface';
import { RequestWithTenantContext } from './types/request-with-tenant-context.type';

@Injectable()
export class TenantContextResolver {
  resolve(request: RequestWithTenantContext): string | undefined {
    const fromUser = this.resolveFromAuthenticatedUser(request.user);
    if (fromUser) {
      return fromUser;
    }

    const fromHeader = this.resolveFromHeader(request);
    if (fromHeader) {
      return fromHeader;
    }

    return this.resolveFromAuthorizationHeader(
      request.headers.authorization,
    );
  }

  private resolveFromAuthenticatedUser(
    user: AuthenticatedUser | undefined,
  ): string | undefined {
    return this.normalizeOrganizationId(user?.organizationId);
  }

  private resolveFromHeader(
    request: RequestWithTenantContext,
  ): string | undefined {
    const headerValue = request.headers[ORGANIZATION_ID_HEADER];
    const organizationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    return this.normalizeOrganizationId(organizationId);
  }

  private resolveFromAuthorizationHeader(
    authorizationHeader: string | undefined,
  ): string | undefined {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) {
      return undefined;
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return undefined;
    }

    for (const claim of JWT_ORGANIZATION_ID_CLAIMS) {
      const organizationId = this.normalizeOrganizationId(payload[claim]);
      if (organizationId) {
        return organizationId;
      }
    }

    return undefined;
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
      const payload = JSON.parse(
        Buffer.from(segments[1], 'base64url').toString('utf8'),
      ) as JwtTenantPayload;

      return payload;
    } catch {
      return undefined;
    }
  }

  private normalizeOrganizationId(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const organizationId = value.trim();
    return organizationId.length > 0 ? organizationId : undefined;
  }
}
