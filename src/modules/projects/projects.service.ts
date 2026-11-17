import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
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
