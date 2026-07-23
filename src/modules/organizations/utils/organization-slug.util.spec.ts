import {
  appendOrganizationSlugSuffix,
  slugifyOrganizationName,
  normalizeOrganizationSlug,
} from './organization-slug.util';

describe('organization-slug.util', () => {
  it('slugifies organization names', () => {
    expect(slugifyOrganizationName('Acme Corp')).toBe('acme-corp');
    expect(slugifyOrganizationName('  My   Company  ')).toBe('my-company');
  });

  it('normalizes provided slugs', () => {
    expect(normalizeOrganizationSlug(' Acme-Corp ')).toBe('acme-corp');
  });

  it('falls back when slugify produces an empty value', () => {
    expect(slugifyOrganizationName('!!!')).toBe('organization');
  });

  it('appends numeric suffixes without exceeding max length', () => {
    expect(appendOrganizationSlugSuffix('acme-corp', 2)).toBe('acme-corp-2');

    const longBase = 'a'.repeat(120);
    expect(appendOrganizationSlugSuffix(longBase, 12)).toHaveLength(120);
    expect(appendOrganizationSlugSuffix(longBase, 12)).toMatch(/-12$/);
  });
});
