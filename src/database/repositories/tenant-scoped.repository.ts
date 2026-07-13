import { ForbiddenException } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { TenantScopedEntity } from '../entities/tenant-scoped.entity';
import { applyTenantScope } from '../helpers/apply-tenant-scope.helper';
import { withOrganizationScope } from '../helpers/tenant-find-options.helper';

/**
 * Repository base for tenant-owned entities. All queries are scoped to the
 * active organization from {@link TenantContextService}.
 *
 * @see ../../../docs/tenant-isolation.md
 */
export abstract class TenantScopedRepository<
  T extends TenantScopedEntity,
> {
  protected abstract readonly repository: Repository<T>;

  constructor(protected readonly tenantContext: TenantContextService) {}

  protected get organizationId(): string {
    return this.tenantContext.requireOrganizationId();
  }

  protected scopedWhere(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    return withOrganizationScope(this.organizationId, where);
  }

  protected assertTenantOwnership(entity: T): void {
    if (entity.organizationId !== this.organizationId) {
      throw new ForbiddenException(
        'Resource does not belong to the current organization.',
      );
    }
  }

  create(data: DeepPartial<T>): T {
    return this.repository.create({
      ...data,
      organizationId: this.organizationId,
    });
  }

  scopedQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return applyTenantScope(
      this.repository.createQueryBuilder(alias),
      this.organizationId,
      alias,
    );
  }

  find(options?: Omit<FindManyOptions<T>, 'where'> & {
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  }): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: this.scopedWhere(options?.where),
    });
  }

  findOne(
    options: Omit<FindOneOptions<T>, 'where'> & {
      where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    },
  ): Promise<T | null> {
    return this.repository.findOne({
      ...options,
      where: this.scopedWhere(options.where),
    });
  }

  findOneBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<T | null> {
    return this.repository.findOneBy(this.scopedWhere(where));
  }

  findOneById(id: string): Promise<T | null> {
    return this.repository.findOneBy(
      this.scopedWhere({ id } as FindOptionsWhere<T>),
    );
  }

  count(
    options?: Omit<FindManyOptions<T>, 'where'> & {
      where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    },
  ): Promise<number> {
    return this.repository.count({
      ...options,
      where: this.scopedWhere(options?.where),
    });
  }

  async save(entity: T): Promise<T> {
    this.assertTenantOwnership(entity);
    return this.repository.save(entity);
  }

  async softRemove(entity: T): Promise<T> {
    this.assertTenantOwnership(entity);
    return this.repository.softRemove(entity);
  }
}
