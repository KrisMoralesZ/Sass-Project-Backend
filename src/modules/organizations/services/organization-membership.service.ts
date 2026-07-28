import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { AppException } from '@common/errors';
import {
  createPaginatedResult,
  resolvePagination,
  resolveSort,
} from '@common/utils/pagination.util';
import {
  ListOrganizationMembersQueryDto,
  ORGANIZATION_MEMBER_SORT_FIELDS,
} from '../dto/list-organization-members-query.dto';
import { OrganizationMember } from '../entities/organization-member.entity';
import { OrganizationRole } from '../enums/organization-role.enum';
import { OrganizationMemberResponse } from '../interfaces/organization-member-response.interface';

@Injectable()
export class OrganizationMembershipService {
  constructor(
    @InjectRepository(OrganizationMember)
    private readonly membersRepository: Repository<OrganizationMember>,
  ) {}

  async createMembership(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMember> {
    const membership = this.membersRepository.create({
      organizationId,
      userId,
      role,
    });

    return this.membersRepository.save(membership);
  }

  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.membersRepository.findOne({
      where: { userId, organizationId },
    });

    return membership !== null;
  }

  async isActiveMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const membership = await this.getActiveMembership(userId, organizationId);
    return membership !== null;
  }

  async getActiveMembership(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null> {
    return this.createActiveMembershipQueryBuilder(userId)
      .andWhere('member.organizationId = :organizationId', { organizationId })
      .getOne();
  }

  async getOrganizationIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.membersRepository.find({
      where: { userId },
      select: { organizationId: true },
    });

    return memberships.map((membership) => membership.organizationId);
  }

  async getActiveOrganizationIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.createActiveMembershipQueryBuilder(userId)
      .select('member.organizationId', 'organizationId')
      .getRawMany<{ organizationId: string }>();

    return memberships.map((membership) => membership.organizationId);
  }

  async filterAccessibleOrganizationIds(
    userId: string,
    organizationIds: string[],
  ): Promise<string[]> {
    if (organizationIds.length === 0) {
      return [];
    }

    const memberships = await this.createActiveMembershipQueryBuilder(userId)
      .andWhere('member.organizationId IN (:...organizationIds)', {
        organizationIds,
      })
      .select('member.organizationId', 'organizationId')
      .getRawMany<{ organizationId: string }>();

    return memberships.map((membership) => membership.organizationId);
  }

  async listMembers(
    organizationId: string,
    query: ListOrganizationMembersQueryDto,
  ) {
    const pagination = resolvePagination(query);
    const order = resolveSort(query, ORGANIZATION_MEMBER_SORT_FIELDS, {
      sortBy: 'createdAt',
      sortOrder: SortOrder.ASC,
    });

    const queryBuilder =
      this.createMembersWithProfileQueryBuilder(organizationId);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR COALESCE(profile.displayName, user.displayName) ILIKE :search)',
        { search },
      );
    }

    for (const [field, direction] of Object.entries(order)) {
      queryBuilder.addOrderBy(`member.${field}`, direction);
    }

    const [items, total] = await queryBuilder
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return createPaginatedResult(
      items.map((membership) => this.toMemberResponse(membership)),
      total,
      query,
    );
  }

  async getMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberResponse> {
    const membership = await this.createMembersWithProfileQueryBuilder(
      organizationId,
    )
      .andWhere('member.userId = :userId', { userId })
      .getOne();

    if (!membership) {
      throw AppException.notFound('Organization member not found');
    }

    return this.toMemberResponse(membership);
  }

  private createMembersWithProfileQueryBuilder(
    organizationId: string,
  ): SelectQueryBuilder<OrganizationMember> {
    return this.membersRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('member.organizationId = :organizationId', { organizationId });
  }

  private createActiveMembershipQueryBuilder(
    userId: string,
  ): SelectQueryBuilder<OrganizationMember> {
    return this.membersRepository
      .createQueryBuilder('member')
      .innerJoin('member.organization', 'organization')
      .where('member.userId = :userId', { userId })
      .andWhere('organization.deletedAt IS NULL');
  }

  private toMemberResponse(
    membership: OrganizationMember,
  ): OrganizationMemberResponse {
    const profile = membership.user.profile;

    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      email: membership.user.email,
      displayName: profile?.displayName ?? membership.user.displayName,
      avatarUrl: profile?.avatarUrl ?? null,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
