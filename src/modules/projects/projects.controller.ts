import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@authentication/decorators/current-user.decorator';
import { CurrentOrganization, ORGANIZATION_ID_HEADER } from '@common/tenant';
import { CreateProjectDto } from './dto/create-project.dto';
import { OrganizationPermission } from '../organizations/permissions/organization-permission.enum';
import { RequirePermissions } from '../organizations/rbac';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@ApiHeader({
  name: ORGANIZATION_ID_HEADER,
  required: true,
  description: 'Active organization context for the request',
})
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(OrganizationPermission.PROJECT_CREATE)
  @ApiOperation({ summary: 'Create a project in the active organization' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid project data or no active organization',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Missing project:create permission',
  })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentOrganization({ required: true }) organizationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.create(dto, organizationId, user.id);
  }
}
