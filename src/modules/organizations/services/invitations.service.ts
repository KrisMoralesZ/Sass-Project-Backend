import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { AppException, ErrorCode } from '@common/errors';
import type { AuthenticatedUser } from '@common/tenant/interfaces/tenant-context.interface';
import {
  buildFindManyOptions,
  createPaginatedResult,
} from '@common/utils/pagination.util';
import {
  getInvitationExpiresAt,
  INVITATION_ACCEPTED_STATUS,
  INVITATION_DEFAULT_ROLE,
  INVITATION_EXPIRED_STATUS,
  INVITATION_PENDING_STATUS,
  INVITATION_REVOKED_STATUS,
  type InvitationStatus,
} from '@organizations/constants/organization-invitations-v1.policy';
import { AcceptInvitationDto } from '@organizations/dto/accept-invitation.dto';
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
import { Organization } from '../entities/organization.entity';
import { AcceptInvitationResponse } from '../interfaces/accept-invitation-response.interface';
import { InvitationResponse } from '../interfaces/invitation-response.interface';
import { DevelopmentInvitationMailer } from './development-invitation-mailer.service';
import { OrganizationMembershipService } from './organization-membership.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
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
        status: INVITATION_PENDING_STATUS,
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
      status: query.status ?? INVITATION_PENDING_STATUS,
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
   * `POST /invites/:id/revoke` — tenant-scoped; requires `invite:revoke`
   * (controller guard).
   *
   * Idempotent for invites that are already `revoked` or past their TTL.
   * `accepted` is terminal: the invitee already holds a membership, so revoking
   * is a conflict rather than a no-op.
   */
  async revokeInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<InvitationResponse> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId, organizationId },
    });

    if (!invitation) {
      throw AppException.notFound('Invitation not found');
    }

    if (invitation.status === INVITATION_ACCEPTED_STATUS) {
      throw AppException.conflict(
        'This invitation has already been accepted and cannot be revoked',
      );
    }

    if (this.resolveStatus(invitation) !== INVITATION_PENDING_STATUS) {
      return this.toResponse(invitation);
    }

    invitation.status = INVITATION_REVOKED_STATUS;
    const revokedInvitation = await this.invitationsRepository.save(invitation);

    return this.toResponse(revokedInvitation);
  }

  /**
   * `POST /invites/accept` — authenticated but **not** tenant-scoped: the invitee is
   * not a member yet, so the organization is resolved from the invitation itself
   * and no `invite:*` permission applies.
   *
   * Accept is idempotent for an invite the same user already consumed: it returns
   * the existing membership instead of creating a second one.
   */
  async acceptInvitation(
    user: AuthenticatedUser,
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponse> {
    const userEmail = user.email
      ? normalizeInvitationEmail(user.email)
      : undefined;

    if (!userEmail) {
      throw AppException.unauthorized('Authentication is required');
    }

    const invitation = await this.findInvitationByToken(
      hashInvitationToken(dto.token),
    );

    if (!invitation) {
      throw AppException.notFound('Invitation not found');
    }

    const status = this.resolveStatus(invitation);

    if (status === INVITATION_EXPIRED_STATUS) {
      throw AppException.badRequest(
        ErrorCode.BAD_REQUEST,
        'This invitation has expired. Ask for a new invitation.',
      );
    }

    if (status === INVITATION_REVOKED_STATUS) {
      throw AppException.badRequest(
        ErrorCode.BAD_REQUEST,
        'This invitation has been revoked',
      );
    }

    if (invitation.email !== userEmail) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'This invitation was issued to a different email address',
      );
    }

    const isAlreadyMember =
      await this.organizationMembershipService.isActiveMember(
        user.id,
        invitation.organizationId,
      );

    if (status === INVITATION_ACCEPTED_STATUS) {
      if (!isAlreadyMember) {
        throw AppException.conflict(
          'This invitation has already been accepted',
        );
      }

      return this.toAcceptResponse(invitation, user.id);
    }

    if (isAlreadyMember) {
      throw AppException.conflict(
        'You are already a member of this organization',
      );
    }

    await this.assertOrganizationIsActive(invitation.organizationId);

    await this.organizationMembershipService.createMembership(
      invitation.organizationId,
      user.id,
      invitation.role,
    );

    invitation.status = INVITATION_ACCEPTED_STATUS;
    const acceptedInvitation =
      await this.invitationsRepository.save(invitation);

    return this.toAcceptResponse(acceptedInvitation, user.id);
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
        status: INVITATION_PENDING_STATUS,
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
      invitation.status === INVITATION_PENDING_STATUS &&
      invitation.expiresAt.getTime() <= Date.now()
    ) {
      return INVITATION_EXPIRED_STATUS;
    }

    return invitation.status;
  }

  private findInvitationByToken(tokenHash: string): Promise<Invitation | null> {
    return this.invitationsRepository.findOne({ where: { tokenHash } });
  }

  private async assertOrganizationIsActive(
    organizationId: string,
  ): Promise<void> {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
      withDeleted: true,
    });

    if (!organization) {
      throw AppException.notFound('Organization not found');
    }

    if (organization.deletedAt) {
      throw AppException.forbidden(
        ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
        'This organization is archived',
      );
    }
  }

  private async toAcceptResponse(
    invitation: Invitation,
    userId: string,
  ): Promise<AcceptInvitationResponse> {
    const membership = await this.organizationMembershipService.getMember(
      invitation.organizationId,
      userId,
    );

    return {
      invitation: this.toResponse(invitation),
      membership,
    };
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
