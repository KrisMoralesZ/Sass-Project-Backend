import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { AppException } from '@common/errors';
import {
  buildFindManyOptions,
  createPaginatedResult,
} from '@common/utils/pagination.util';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  ListOrganizationsQueryDto,
  ORGANIZATION_SORT_FIELDS,
} from './dto/list-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationPlan } from './enums/organization-plan.enum';
import { OrganizationResponse } from './interfaces/organization-response.interface';
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  OrganizationSettings,
} from './interfaces/organization-settings.interface';
import {
  appendOrganizationSlugSuffix,
  normalizeOrganizationSlug,
  slugifyOrganizationName,
} from './utils/organization-slug.util';

const MAX_SLUG_COLLISION_ATTEMPTS = 100;

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    _userId: string,
  ): Promise<OrganizationResponse> {
    void _userId;

    const baseSlug = dto.slug
      ? normalizeOrganizationSlug(dto.slug)
      : slugifyOrganizationName(dto.name);

    const slug = await this.resolveAvailableSlug(baseSlug, {
      requireExactMatch: Boolean(dto.slug),
    });

    const organization = this.organizationsRepository.create({
      name: dto.name.trim(),
      slug,
      plan: dto.plan ?? OrganizationPlan.FREE,
      settings: { ...DEFAULT_ORGANIZATION_SETTINGS },
    });

    const savedOrganization =
      await this.organizationsRepository.save(organization);

    return this.toResponse(savedOrganization);
  }

  async findAll(query: ListOrganizationsQueryDto, _userId: string) {
    void _userId;

    const findOptions = buildFindManyOptions(query, ORGANIZATION_SORT_FIELDS, {
      sortBy: 'createdAt',
      sortOrder: SortOrder.DESC,
    });

    const where = query.search
      ? [
          { name: ILike(`%${query.search}%`) },
          { slug: ILike(`%${query.search}%`) },
        ]
      : undefined;

    const [items, total] = await this.organizationsRepository.findAndCount({
      ...findOptions,
      where,
    });

    return createPaginatedResult(
      items.map((organization) => this.toResponse(organization)),
      total,
      query,
    );
  }

  async findOne(id: string, _userId: string): Promise<OrganizationResponse> {
    void _userId;

    const organization = await this.findOrganizationById(id);
    return this.toResponse(organization);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    _userId: string,
  ): Promise<OrganizationResponse> {
    void _userId;

    const organization = await this.findOrganizationById(id);

    if (dto.name !== undefined) {
      organization.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      const normalizedSlug = normalizeOrganizationSlug(dto.slug);
      await this.assertSlugIsAvailable(normalizedSlug, organization.id);
      organization.slug = normalizedSlug;
    }

    if (dto.plan !== undefined) {
      organization.plan = dto.plan;
    }

    if (dto.settings !== undefined) {
      organization.settings = this.mergeSettings(
        organization.settings,
        dto.settings,
      );
    }

    const savedOrganization =
      await this.organizationsRepository.save(organization);

    return this.toResponse(savedOrganization);
  }

  async remove(id: string, _userId: string): Promise<void> {
    void _userId;

    const organization = await this.findOrganizationById(id);
    await this.organizationsRepository.softRemove(organization);
  }

  private async findOrganizationById(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw AppException.notFound('Organization not found');
    }

    return organization;
  }

  private async resolveAvailableSlug(
    baseSlug: string,
    options: { requireExactMatch?: boolean } = {},
  ): Promise<string> {
    const { requireExactMatch = false } = options;

    if (requireExactMatch) {
      await this.assertSlugIsAvailable(baseSlug);
      return baseSlug;
    }

    if (await this.isSlugAvailable(baseSlug)) {
      return baseSlug;
    }

    for (let suffix = 2; suffix <= MAX_SLUG_COLLISION_ATTEMPTS; suffix += 1) {
      const candidate = appendOrganizationSlugSuffix(baseSlug, suffix);

      if (await this.isSlugAvailable(candidate)) {
        return candidate;
      }
    }

    throw AppException.conflict(
      `Unable to generate a unique slug for "${baseSlug}"`,
    );
  }

  private async isSlugAvailable(
    slug: string,
    excludeOrganizationId?: string,
  ): Promise<boolean> {
    const existingOrganization = await this.organizationsRepository.findOne({
      where: { slug },
      withDeleted: false,
    });

    return (
      !existingOrganization ||
      existingOrganization.id === excludeOrganizationId
    );
  }

  private async assertSlugIsAvailable(
    slug: string,
    excludeOrganizationId?: string,
  ): Promise<void> {
    if (!(await this.isSlugAvailable(slug, excludeOrganizationId))) {
      throw AppException.conflict(
        `Organization slug "${slug}" is already taken`,
      );
    }
  }

  private mergeSettings(
    currentSettings: Record<string, unknown>,
    patch: OrganizationSettings,
  ): Record<string, unknown> {
    const current = currentSettings as OrganizationSettings;

    return {
      ...current,
      ...patch,
      branding: {
        ...current.branding,
        ...patch.branding,
      },
      featureFlags: {
        ...current.featureFlags,
        ...patch.featureFlags,
      },
    };
  }

  private toResponse(organization: Organization): OrganizationResponse {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
      settings: organization.settings,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
