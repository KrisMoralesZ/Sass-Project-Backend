import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@authentication/decorators/current-user.decorator';
import { CurrentOrganization, ORGANIZATION_ID_HEADER } from '@common/tenant';
import { CreateInvitationDto } from './dto/create-invitation.dto';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(OrganizationPermission.INVITE_CREATE)
  @ApiOperation({ summary: 'Invite an email to the active organization' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Organization context is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Missing invite:create permission' })
  @ApiResponse({
    status: 409,
    description:
      'A pending invitation already exists for that email, or it is already a member',
  })
  create(
    @CurrentOrganization({ required: true }) organizationId: string,
    @CurrentUser() user: { id: string },
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return this.invitationsService.createInvitation(
      organizationId,
      user.id,
      createInvitationDto,
    );
  }

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
