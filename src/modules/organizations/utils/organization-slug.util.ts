export const ORGANIZATION_SLUG_MAX_LENGTH = 120;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyOrganizationName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, ORGANIZATION_SLUG_MAX_LENGTH);

  return slug.length > 0 ? slug : 'organization';
}

export function normalizeOrganizationSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function isValidOrganizationSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function appendOrganizationSlugSuffix(
  baseSlug: string,
  suffix: number,
): string {
  const suffixPart = `-${suffix}`;
  const maxBaseLength = ORGANIZATION_SLUG_MAX_LENGTH - suffixPart.length;
  const trimmedBase = baseSlug.slice(0, maxBaseLength).replace(/-+$/, '');

  return `${trimmedBase}${suffixPart}`;
}

export const ORGANIZATION_SLUG_PATTERN = SLUG_PATTERN;
