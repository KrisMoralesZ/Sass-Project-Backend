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
    const project = await this.projectsRepository.findOne({
      where: { id, organizationId },
    });

    if (!project) {
      throw AppException.notFound('Project not found');
    }

    return this.toResponse(project);
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
