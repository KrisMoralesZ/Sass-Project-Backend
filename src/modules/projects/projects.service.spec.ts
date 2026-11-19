import { ILike, Repository } from 'typeorm';
import { SortOrder } from '@common/enums/sort-order.enum';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { Project } from './entities/project.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { OrganizationRole } from '../organizations/enums/organization-role.enum';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepository: jest.Mocked<
    Pick<
      Repository<Project>,
      'create' | 'save' | 'findAndCount' | 'findOne' | 'softRemove'
    >
  >;

  beforeEach(() => {
    projectsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
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

  it('allows a member to update a project they own', async () => {
    const project = {
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Old name',
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
    projectsRepository.findOne.mockResolvedValue(project);
    projectsRepository.save.mockImplementation(
      async (value) => value as Project,
    );

    await expect(
      service.update(
        'project-1',
        { name: ' New name ', status: ProjectStatus.ARCHIVED },
        'org-1',
        { userId: 'user-1', role: OrganizationRole.MEMBER },
      ),
    ).resolves.toMatchObject({
      name: 'New name',
      status: ProjectStatus.ARCHIVED,
    });
  });

  it('forbids a member from updating another member project', async () => {
    projectsRepository.findOne.mockResolvedValue({
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-2',
    } as Project);

    await expect(
      service.update('project-1', { name: 'Changed' }, 'org-1', {
        userId: 'user-1',
        role: OrganizationRole.MEMBER,
      }),
    ).rejects.toThrow('Only the project owner or an organization admin');
  });

  it('allows an admin to update and soft-delete projects', async () => {
    const project = {
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-2',
      name: 'Website redesign',
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
    projectsRepository.findOne.mockResolvedValue(project);
    projectsRepository.save.mockImplementation(
      async (value) => value as Project,
    );
    projectsRepository.softRemove.mockResolvedValue(project);

    await service.update('project-1', { name: 'Updated' }, 'org-1', {
      userId: 'user-1',
      role: OrganizationRole.ADMIN,
    });
    await service.remove('project-1', 'org-1', {
      userId: 'user-1',
      role: OrganizationRole.ADMIN,
    });

    expect(projectsRepository.save).toHaveBeenCalledWith(project);
    expect(projectsRepository.softRemove).toHaveBeenCalledWith(project);
  });
});
