import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@authentication/decorators/current-user.decorator';
import { OptionalOrganization } from '@common/tenant';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@OptionalOrganization()
@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({ status: 409, description: 'Organization slug already exists' })
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiResponse({ status: 200, description: 'Paginated organization list' })
  findAll(
    @Query() query: ListOrganizationsQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.findAll(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by id' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 409, description: 'Organization slug already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive organization' })
  @ApiResponse({
    status: 204,
    description: 'Organization archived successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    await this.organizationsService.remove(id, user.id);
  }
}
