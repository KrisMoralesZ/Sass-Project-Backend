import { FindManyOptions } from 'typeorm';
import { AppException, ErrorCode } from '@common/errors';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  PaginationQueryDto,
} from '@common/dto/pagination-query.dto';
import { SortQueryDto } from '@common/dto/sort-query.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import {
  PaginatedResult,
  PaginationMeta,
} from '@common/interfaces/paginated-response.interface';

export interface ResolvedPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface SortDefaults<T extends string> {
  sortBy: T;
  sortOrder: SortOrder;
}

export function resolvePagination(
  query: PaginationQueryDto,
): ResolvedPagination {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function resolveSort<T extends string>(
  query: SortQueryDto,
  allowedFields: readonly T[],
  defaults: SortDefaults<T>,
): Record<string, SortOrder> {
  if (query.sortBy && !allowedFields.includes(query.sortBy as T)) {
    throw AppException.badRequest(
      ErrorCode.INVALID_SORT_FIELD,
      `Invalid sort field "${query.sortBy}". Allowed values: ${allowedFields.join(', ')}.`,
    );
  }

  const sortBy = (query.sortBy as T | undefined) ?? defaults.sortBy;
  const sortOrder = query.sortOrder ?? defaults.sortOrder;

  return { [sortBy]: sortOrder };
}

export function buildPaginationMeta(
  total: number,
  pagination: ResolvedPagination,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pagination.limit);

  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1 && totalPages > 0,
  };
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  query: PaginationQueryDto,
): PaginatedResult<T> {
  const pagination = resolvePagination(query);

  return {
    items,
    pagination: buildPaginationMeta(total, pagination),
  };
}

export function buildFindManyOptions<T extends string>(
  query: PaginationQueryDto & SortQueryDto,
  allowedSortFields: readonly T[],
  sortDefaults: SortDefaults<T>,
): Pick<FindManyOptions, 'skip' | 'take' | 'order'> {
  const pagination = resolvePagination(query);

  return {
    skip: pagination.skip,
    take: pagination.limit,
    order: resolveSort(query, allowedSortFields, sortDefaults),
  };
}
