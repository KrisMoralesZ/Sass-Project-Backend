import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { OrganizationPermission } from '@organizations/permissions/organization-permission.enum';
import { REQUIRED_PERMISSIONS_KEY } from '@organizations/rbac/constants/rbac-metadata.constants';
import { OrganizationMembershipService } from '@organizations/services/organization-membership.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { OrganizationRole } from '../organizations/enums/organization-role.enum';
import { ProjectStatus } from './enums/project-status.enum';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  it('passes active organization and authenticated owner to the service', async () => {
    const response = {
      id: 'project-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Website redesign',
      description: null,
      status: ProjectStatus.ACTIVE,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const projectsService: jest.Mocked<Pick<ProjectsService, 'create'>> = {
      create: jest.fn().mockResolvedValue(response),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: projectsService },
        {
          provide: OrganizationMembershipService,
          useValue: { getActiveMembership: jest.fn() },
        },
      ],
    }).compile();
    const controller = moduleRef.get(ProjectsController);
    const dto: CreateProjectDto = { name: 'Website redesign' };

    await expect(
      controller.create(dto, 'org-1', { id: 'user-1' }),
    ).resolves.toEqual(response);
    expect(projectsService.create).toHaveBeenCalledWith(dto, 'org-1', 'user-1');
  });

  it('requires project:create permission', () => {
    const createHandler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'create',
    )?.value as ProjectsController['create'];
    const requiredPermissions = new Reflector().get<OrganizationPermission[]>(
      REQUIRED_PERMISSIONS_KEY,
      createHandler,
    );

    expect(requiredPermissions).toEqual([
      OrganizationPermission.PROJECT_CREATE,
    ]);
  });

  it('passes update and delete context to the service', async () => {
    const projectsService: jest.Mocked<
      Pick<ProjectsService, 'update' | 'remove'>
    > = {
      update: jest.fn().mockResolvedValue({ id: 'project-1' }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: projectsService },
        {
          provide: OrganizationMembershipService,
          useValue: { getActiveMembership: jest.fn() },
        },
      ],
    }).compile();
    const controller = moduleRef.get(ProjectsController);

    await controller.update(
      'project-1',
      { name: 'Updated' },
      'org-1',
      { id: 'user-1' },
      OrganizationRole.ADMIN,
    );
    await controller.remove(
      'project-1',
      'org-1',
      { id: 'user-1' },
      OrganizationRole.ADMIN,
    );

    expect(projectsService.update).toHaveBeenCalledWith(
      'project-1',
      { name: 'Updated' },
      'org-1',
      { userId: 'user-1', role: OrganizationRole.ADMIN },
    );
    expect(projectsService.remove).toHaveBeenCalledWith('project-1', 'org-1', {
      userId: 'user-1',
      role: OrganizationRole.ADMIN,
    });
  });

  it('requires project:update and project:delete permissions', () => {
    const reflector = new Reflector();
    const updateHandler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'update',
    )?.value as ProjectsController['update'];
    const removeHandler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'remove',
    )?.value as ProjectsController['remove'];

    expect(
      reflector.get<OrganizationPermission[]>(
        REQUIRED_PERMISSIONS_KEY,
        updateHandler,
      ),
    ).toEqual([OrganizationPermission.PROJECT_UPDATE]);
    expect(
      reflector.get<OrganizationPermission[]>(
        REQUIRED_PERMISSIONS_KEY,
        removeHandler,
      ),
    ).toEqual([OrganizationPermission.PROJECT_DELETE]);
  });

  it('requires project:read permission for list and detail routes', () => {
    const reflector = new Reflector();
    const findAllHandler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'findAll',
    )?.value as ProjectsController['findAll'];
    const findOneHandler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'findOne',
    )?.value as ProjectsController['findOne'];

    expect(
      reflector.get<OrganizationPermission[]>(
        REQUIRED_PERMISSIONS_KEY,
        findAllHandler,
      ),
    ).toEqual([OrganizationPermission.PROJECT_READ]);
    expect(
      reflector.get<OrganizationPermission[]>(
        REQUIRED_PERMISSIONS_KEY,
        findOneHandler,
      ),
    ).toEqual([OrganizationPermission.PROJECT_READ]);
  });
});
