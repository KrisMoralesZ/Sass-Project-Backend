import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import {
  buildFindManyOptions,
  createPaginatedResult,
} from '@common/utils/pagination.util';
import {
  INVITATION_STATUSES,
  type InvitationStatus,
} from '@organizations/constants/organization-invitations-v1.policy';
import {
  INVITATION_SORT_FIELDS,
  ListInvitationsQueryDto,
} from '../dto/list-invitations-query.dto';
import { Invitation } from '../entities/invitation.entity';
import { InvitationResponse } from '../interfaces/invitation-response.interface';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
  ) {}

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
      status: query.status ?? INVITATION_STATUSES[0],
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
   * Derives `expired` at read time so stale pending rows read consistently
   * with stored terminal statuses.
   */
  private resolveStatus(invitation: Invitation): InvitationStatus {
    if (
      invitation.status === 'pending' &&
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
