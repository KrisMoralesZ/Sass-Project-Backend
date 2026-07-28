import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { UserProfile } from './user-profile.entity';

describe('UserProfile', () => {
  it('extends BaseEntity as a global profile record', () => {
    expect(Object.getPrototypeOf(UserProfile)).toBe(BaseEntity);
  });

  it('defines userId and displayName columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === UserProfile)
      .map((column) => column.propertyName);

    expect(columns).toEqual(expect.arrayContaining(['userId', 'displayName']));
  });

  it('enforces a unique profile per user', () => {
    const indices = getMetadataArgsStorage()
      .indices.filter((index) => index.target === UserProfile)
      .flatMap((index) => (Array.isArray(index.columns) ? index.columns : []));

    expect(indices).toContain('userId');
  });
});
