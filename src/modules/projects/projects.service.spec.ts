import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepository: jest.Mocked<
    Pick<Repository<Project>, 'create' | 'save'>
  >;

  beforeEach(() => {
    projectsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new ProjectsService(
      projectsRepository as Repository<Project>,
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

    await expect(
      service.create(dto, 'org-1', 'user-1'),
    ).resolves.toEqual({
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
});
