import {
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
});
