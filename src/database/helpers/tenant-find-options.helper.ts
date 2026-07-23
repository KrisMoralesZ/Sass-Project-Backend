import { FindOptionsWhere } from 'typeorm';
import { TenantScopedEntity } from '@database/entities/tenant-scoped.entity';

export function withOrganizationScope<T extends TenantScopedEntity>(
  organizationId: string,
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
  if (!where) {
    return { organizationId } as FindOptionsWhere<T>;
  }

  if (Array.isArray(where)) {
    return where.map((condition) => ({
      ...condition,
      organizationId,
    }));
  }

  return {
    ...where,
    organizationId,
  };
}
