import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentOrganization, ORGANIZATION_ID_HEADER } from '@common/tenant';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto';
import { OrganizationPermission } from './permissions/organization-permission.enum';
import { RequirePermissions } from './rbac';
import { InvitationsService } from './services/invitations.service';

@ApiTags('invites')
@ApiBearerAuth()
@ApiHeader({
  name: ORGANIZATION_ID_HEADER,
  required: true,
  description: 'Active organization context for the request',
})
@Controller({ path: 'invites', version: '1' })
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @RequirePermissions(OrganizationPermission.INVITE_READ)
  @ApiOperation({ summary: 'List invitations in the active organization' })
  @ApiResponse({
    status: 200,
    description: 'Paginated organization invitations',
  })
  @ApiResponse({ status: 400, description: 'Organization context is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Missing invite:read permission' })
  findAll(
    @CurrentOrganization({ required: true }) organizationId: string,
    @Query() query: ListInvitationsQueryDto,
  ) {
    return this.invitationsService.listInvitations(organizationId, query);
  }
}
