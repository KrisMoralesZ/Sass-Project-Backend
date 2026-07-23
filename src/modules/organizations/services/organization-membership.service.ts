import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrganizationMember } from '@organizations/entities/organization-member.entity';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';

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
    const count = await this.createActiveMembershipQueryBuilder(userId)
      .andWhere('member.organizationId = :organizationId', { organizationId })
      .getCount();

    return count > 0;
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

  private createActiveMembershipQueryBuilder(
    userId: string,
  ): SelectQueryBuilder<OrganizationMember> {
    return this.membersRepository
      .createQueryBuilder('member')
      .innerJoin('member.organization', 'organization')
      .where('member.userId = :userId', { userId })
      .andWhere('organization.deletedAt IS NULL');
  }
}
