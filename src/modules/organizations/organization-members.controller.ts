import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentOrganization, ORGANIZATION_ID_HEADER } from '@common/tenant';
import { ListOrganizationMembersQueryDto } from './dto/list-organization-members-query.dto';
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
}
