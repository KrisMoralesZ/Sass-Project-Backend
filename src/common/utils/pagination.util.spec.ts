import { BadRequestException } from '@nestjs/common';
import { SortOrder } from '../enums/sort-order.enum';
import {
  buildFindManyOptions,
  buildPaginationMeta,
  createPaginatedResult,
  resolvePagination,
  resolveSort,
} from './pagination.util';

describe('resolvePagination', () => {
  it('uses defaults when page and limit are omitted', () => {
    expect(resolvePagination({})).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  it('calculates skip from page and limit', () => {
    expect(resolvePagination({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });
});

describe('resolveSort', () => {
  const allowedFields = ['createdAt', 'name'] as const;

  it('returns defaults when sort is omitted', () => {
    expect(
      resolveSort({}, allowedFields, {
        sortBy: 'createdAt',
        sortOrder: SortOrder.DESC,
      }),
    ).toEqual({ createdAt: SortOrder.DESC });
  });

  it('uses provided sort field and order', () => {
    expect(
      resolveSort({ sortBy: 'name', sortOrder: SortOrder.ASC }, allowedFields, {
        sortBy: 'createdAt',
        sortOrder: SortOrder.DESC,
      }),
    ).toEqual({ name: SortOrder.ASC });
  });

  it('rejects unsupported sort fields', () => {
    expect(() =>
      resolveSort({ sortBy: 'password' }, allowedFields, {
        sortBy: 'createdAt',
        sortOrder: SortOrder.DESC,
      }),
    ).toThrow(BadRequestException);
  });
});

describe('createPaginatedResult', () => {
  it('builds items and pagination metadata', () => {
    const result = createPaginatedResult([{ id: '1' }, { id: '2' }], 25, {
      page: 2,
      limit: 10,
    });

    expect(result.items).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });
});

describe('buildFindManyOptions', () => {
  it('combines pagination and sort for TypeORM', () => {
    expect(
      buildFindManyOptions(
        { page: 2, limit: 5, sortBy: 'name', sortOrder: SortOrder.ASC },
        ['createdAt', 'name'] as const,
        { sortBy: 'createdAt', sortOrder: SortOrder.DESC },
      ),
    ).toEqual({
      skip: 5,
      take: 5,
      order: { name: SortOrder.ASC },
    });
  });
});

describe('buildPaginationMeta', () => {
  it('returns zero total pages when total is zero', () => {
    expect(buildPaginationMeta(0, { page: 1, limit: 20, skip: 0 })).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
