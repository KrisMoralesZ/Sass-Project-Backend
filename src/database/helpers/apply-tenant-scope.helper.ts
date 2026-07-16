import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function applyTenantScope<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  organizationId: string,
  alias = queryBuilder.alias,
): SelectQueryBuilder<T> {
  return queryBuilder.andWhere(`${alias}.organizationId = :organizationId`, {
    organizationId,
  });
}
