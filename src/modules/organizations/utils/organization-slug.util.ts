const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyOrganizationName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return slug.length > 0 ? slug : 'organization';
}

export function normalizeOrganizationSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function isValidOrganizationSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export const ORGANIZATION_SLUG_PATTERN = SLUG_PATTERN;
