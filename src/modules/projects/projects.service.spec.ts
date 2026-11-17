import { ILike, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { Project } from './entities/project.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepository: jest.Mocked<
    Pick<Repository<Project>, 'create' | 'save' | 'findAndCount' | 'findOne'>
  >;

  beforeEach(() => {
    projectsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };
    service = new ProjectsService(
      projectsRepository as unknown as Repository<Project>,
    );
  });

  it('creates a project with tenant and owner IDs from trusted context', async () => {
    const dto: CreateProjectDto = { name: ' Website redesign ' };
    const entity = {
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Website redesign',
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;

    projectsRepository.create.mockReturnValue(entity);
    projectsRepository.save.mockResolvedValue(entity);

    await expect(service.create(dto, 'org-1', 'user-1')).resolves.toEqual({
      id: entity.id,
      organizationId: entity.organizationId,
      ownerId: entity.ownerId,
      name: entity.name,
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    expect(projectsRepository.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Website redesign',
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
    });
    expect(projectsRepository.save).toHaveBeenCalledWith(entity);
  });

  it('persists optional description and metadata', async () => {
    const dto: CreateProjectDto = {
      name: 'Website redesign',
      description: 'Redesign the site',
      metadata: { color: 'blue' },
    };
    const entity = {
      organizationId: 'org-1',
      ownerId: 'user-1',
      ...dto,
      status: ProjectStatus.ACTIVE,
    } as Project;
    projectsRepository.create.mockReturnValue(entity);
    projectsRepository.save.mockResolvedValue(entity);

    await service.create(dto, 'org-1', 'user-1');

    expect(projectsRepository.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: dto.name,
      description: dto.description,
      status: ProjectStatus.ACTIVE,
      metadata: dto.metadata,
    });
  });

  it('lists only projects in the organization with pagination and search', async () => {
    const project = {
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Website redesign',
      description: 'Redesign the site',
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
    const query: ListProjectsQueryDto = {
      page: 2,
      limit: 10,
      search: 'site',
    };
    projectsRepository.findAndCount.mockResolvedValue([[project], 1]);

    await expect(service.findAll(query, 'org-1')).resolves.toMatchObject({
      items: [{ id: 'project-1', organizationId: 'org-1' }],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
    expect(projectsRepository.findAndCount).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      order: { createdAt: SortOrder.DESC },
      where: [
        { name: ILike('%site%'), organizationId: 'org-1' },
        { description: ILike('%site%'), organizationId: 'org-1' },
      ],
    });
  });

  it('looks up project details within the active organization only', async () => {
    const project = {
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Website redesign',
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
    projectsRepository.findOne.mockResolvedValue(project);

    await expect(service.findOne('project-1', 'org-1')).resolves.toMatchObject({
      id: 'project-1',
      organizationId: 'org-1',
    });
    expect(projectsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'project-1', organizationId: 'org-1' },
    });
  });

  it('returns not found when a project is outside the active organization', async () => {
    projectsRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('project-1', 'org-2')).rejects.toThrow(
      'Project not found',
    );
    expect(projectsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'project-1', organizationId: 'org-2' },
    });
  });
});
