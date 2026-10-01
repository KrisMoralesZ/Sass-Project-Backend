import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { AppException } from '@common/errors';
import {
  buildFindManyOptions,
  createPaginatedResult,
} from '@common/utils/pagination.util';
import {
  getInvitationExpiresAt,
  INVITATION_DEFAULT_ROLE,
  INVITATION_STATUSES,
  type InvitationStatus,
} from '@organizations/constants/organization-invitations-v1.policy';
import {
  INVITATION_SORT_FIELDS,
  ListInvitationsQueryDto,
} from '@organizations/dto/list-invitations-query.dto';
import { normalizeInvitationEmail } from '@organizations/utils/invitation-email.util';
import {
  generateInvitationToken,
  hashInvitationToken,
} from '@organizations/utils/invitation-token.util';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { Invitation } from '../entities/invitation.entity';
import { InvitationResponse } from '../interfaces/invitation-response.interface';
import { DevelopmentInvitationMailer } from './development-invitation-mailer.service';
import { OrganizationMembershipService } from './organization-membership.service';

const PENDING_INVITATION_STATUS = INVITATION_STATUSES[0];

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    private readonly organizationMembershipService: OrganizationMembershipService,
    private readonly invitationMailer: DevelopmentInvitationMailer,
  ) {}

  /**
   * `POST /invites` — tenant-scoped; requires `invite:create` (controller guard).
   *
   * The organization always comes from tenant context. The raw token is handed
   * to the mailer and discarded; only its SHA-256 digest is persisted.
   */
  async createInvitation(
    organizationId: string,
    invitedByUserId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponse> {
    const email = normalizeInvitationEmail(dto.email);
    const role = dto.role ?? INVITATION_DEFAULT_ROLE;

    await this.assertCanInvite(organizationId, email);

    const token = generateInvitationToken();
    const expiresAt = getInvitationExpiresAt();

    const invitation = await this.invitationsRepository.save(
      this.invitationsRepository.create({
        organizationId,
        email,
        role,
        tokenHash: hashInvitationToken(token),
        status: PENDING_INVITATION_STATUS,
        invitedByUserId,
        expiresAt,
      }),
    );

    this.invitationMailer.sendInvitationEmail({
      organizationId,
      email,
      role,
      invitedByUserId,
      token,
      expiresAt,
    });

    return this.toResponse(invitation);
  }

  /**
   * `GET /invites` — tenant-scoped; requires `invite:read` (controller guard).
   * Defaults to stored `pending` invites and derives `expired` at read time so
   * stale pending rows read consistently with terminal statuses.
   */
  async listInvitations(
    organizationId: string,
    query: ListInvitationsQueryDto,
  ) {
    const where: FindOptionsWhere<Invitation> = {
      organizationId,
      status: query.status ?? PENDING_INVITATION_STATUS,
    };

    const [items, total] = await this.invitationsRepository.findAndCount({
      ...buildFindManyOptions(query, INVITATION_SORT_FIELDS, {
        sortBy: 'createdAt',
        sortOrder: SortOrder.DESC,
      }),
      where,
    });

    return createPaginatedResult(
      items.map((invitation) => this.toResponse(invitation)),
      total,
      query,
    );
  }

  /**
   * One pending invite per `(organizationId, email)`, and never for an active
   * member. Derived-expired invites do not block a new invite.
   */
  private async assertCanInvite(
    organizationId: string,
    email: string,
  ): Promise<void> {
    const isActiveMember =
      await this.organizationMembershipService.isActiveMemberByEmail(
        organizationId,
        email,
      );

    if (isActiveMember) {
      throw AppException.conflict(
        `"${email}" is already a member of this organization`,
      );
    }

    const pendingInvitation = await this.findPendingInvitation(
      organizationId,
      email,
    );

    if (pendingInvitation) {
      throw AppException.conflict(
        `A pending invitation already exists for "${email}"`,
      );
    }
  }

  private async findPendingInvitation(
    organizationId: string,
    email: string,
  ): Promise<Invitation | null> {
    return this.invitationsRepository
      .createQueryBuilder('invitation')
      .where('invitation.organizationId = :organizationId', { organizationId })
      .andWhere('invitation.email = :email', { email })
      .andWhere('invitation.status = :status', {
        status: PENDING_INVITATION_STATUS,
      })
      .andWhere('invitation.expiresAt > :now', { now: new Date() })
      .getOne();
  }

  /**
   * Derives `expired` at read time so stale pending rows read consistently
   * with stored terminal statuses.
   */
  private resolveStatus(invitation: Invitation): InvitationStatus {
    if (
      invitation.status === PENDING_INVITATION_STATUS &&
      invitation.expiresAt.getTime() <= Date.now()
    ) {
      return 'expired';
    }

    return invitation.status;
  }

  private toResponse(invitation: Invitation): InvitationResponse {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      status: this.resolveStatus(invitation),
      invitedByUserId: invitation.invitedByUserId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
