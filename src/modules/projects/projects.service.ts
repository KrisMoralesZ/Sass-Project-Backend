import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { AppException } from '@common/errors';
import {
  buildFindManyOptions,
  createPaginatedResult,
} from '@common/utils/pagination.util';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ListProjectsQueryDto,
  PROJECT_SORT_FIELDS,
} from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { OrganizationRole } from '../organizations/enums/organization-role.enum';
import { ErrorCode } from '@common/errors/error-code.enum';
import { Project } from './entities/project.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { ProjectResponse } from './interfaces/project-response.interface';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async create(
    dto: CreateProjectDto,
    organizationId: string,
    ownerId: string,
  ): Promise<ProjectResponse> {
    const project = this.projectsRepository.create({
      organizationId,
      ownerId,
      name: dto.name.trim(),
      description: dto.description ?? null,
      status: ProjectStatus.ACTIVE,
      metadata: dto.metadata ?? {},
    });

    return this.toResponse(await this.projectsRepository.save(project));
  }

  async findAll(query: ListProjectsQueryDto, organizationId: string) {
    const findOptions = buildFindManyOptions(query, PROJECT_SORT_FIELDS, {
      sortBy: 'createdAt',
      sortOrder: SortOrder.DESC,
    });
    const searchFilter = query.search
      ? [
          { name: ILike(`%${query.search}%`) },
          { description: ILike(`%${query.search}%`) },
        ]
      : undefined;
    const [projects, total] = await this.projectsRepository.findAndCount({
      ...findOptions,
      where: searchFilter
        ? searchFilter.map((filter) => ({ ...filter, organizationId }))
        : { organizationId },
    });

    return createPaginatedResult(
      projects.map((project) => this.toResponse(project)),
      total,
      query,
    );
  }

  async findOne(id: string, organizationId: string): Promise<ProjectResponse> {
    const project = await this.findOneByTenant(id, organizationId);
    return this.toResponse(project);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    organizationId: string,
    actor: { userId: string; role: OrganizationRole },
  ): Promise<ProjectResponse> {
    const project = await this.findOneByTenant(id, organizationId);

    if (
      actor.role !== OrganizationRole.OWNER &&
      actor.role !== OrganizationRole.ADMIN &&
      project.ownerId !== actor.userId
    ) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'Only the project owner or an organization admin can update this project.',
      );
    }

    if (dto.name !== undefined) project.name = dto.name.trim();
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.metadata !== undefined) project.metadata = dto.metadata;

    return this.toResponse(await this.projectsRepository.save(project));
  }

  async remove(
    id: string,
    organizationId: string,
    actor: { userId: string; role: OrganizationRole },
  ): Promise<void> {
    const project = await this.findOneByTenant(id, organizationId);

    if (
      actor.role !== OrganizationRole.OWNER &&
      actor.role !== OrganizationRole.ADMIN
    ) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'Only organization admins can delete projects.',
      );
    }

    await this.projectsRepository.softRemove(project);
  }

  private async findOneByTenant(
    id: string,
    organizationId: string,
  ): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, organizationId },
    });

    if (!project) {
      throw AppException.notFound('Project not found');
    }

    return project;
  }

  private toResponse(project: Project): ProjectResponse {
    return {
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      status: project.status,
      metadata: project.metadata,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
