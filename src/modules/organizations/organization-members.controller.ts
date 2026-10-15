import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { ListOrganizationMembersQueryDto } from './dto/list-organization-members-query.dto';
import { UpdateOrganizationMemberRoleDto } from './dto/update-organization-member-role.dto';
import { OrganizationRole } from './enums/organization-role.enum';
import { OrganizationPermission } from './permissions/organization-permission.enum';
import { CurrentOrganizationRole, RequirePermissions } from './rbac';
import { OrganizationMembershipService } from './services/organization-membership.service';

@ApiTags('members')
@ApiBearerAuth()
@ApiHeader({
  name: ORGANIZATION_ID_HEADER,
  required: true,
  description: 'Active organization context for the request',
})
@Controller({ path: 'members', version: '1' })
export class OrganizationMembersController {
  constructor(
    private readonly organizationMembershipService: OrganizationMembershipService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List members in the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated organization members' })
  @ApiResponse({ status: 400, description: 'Organization context is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the organization' })
  findAll(
    @CurrentOrganization({ required: true }) organizationId: string,
    @Query() query: ListOrganizationMembersQueryDto,
  ) {
    return this.organizationMembershipService.listMembers(
      organizationId,
      query,
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a member in the active organization' })
  @ApiResponse({ status: 200, description: 'Organization member details' })
  @ApiResponse({ status: 400, description: 'Organization context is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the organization' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  findOne(
    @CurrentOrganization({ required: true }) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.organizationMembershipService.getMember(organizationId, userId);
  }

  @Patch(':userId')
  @RequirePermissions(OrganizationPermission.MEMBER_UPDATE)
  @ApiOperation({ summary: 'Update a member role in the active organization' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 400, description: 'Organization context is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Missing member:update permission' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({
    status: 409,
    description:
      'You cannot change your own role, or the last owner cannot be demoted',
  })
  updateRole(
    @CurrentOrganization({ required: true }) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: UpdateOrganizationMemberRoleDto,
    @CurrentUser() user: { id: string },
    @CurrentOrganizationRole() actorRole: OrganizationRole,
  ) {
    return this.organizationMembershipService.updateMemberRole(
      organizationId,
      userId,
      updateRoleDto.role,
      { userId: user.id, role: actorRole },
    );
  }
}
