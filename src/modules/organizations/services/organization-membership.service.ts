import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async getOrganizationIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.membersRepository.find({
      where: { userId },
      select: ['organizationId'],
    });

    return memberships.map((membership) => membership.organizationId);
  }

  async filterAccessibleOrganizationIds(
    userId: string,
    organizationIds: string[],
  ): Promise<string[]> {
    if (organizationIds.length === 0) {
      return [];
    }

    const memberships = await this.membersRepository.find({
      where: {
        userId,
        organizationId: In(organizationIds),
      },
      select: ['organizationId'],
    });

    return memberships.map((membership) => membership.organizationId);
  }
}
