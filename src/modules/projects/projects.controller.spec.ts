import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { OrganizationPermission } from '@organizations/permissions/organization-permission.enum';
import { REQUIRED_PERMISSIONS_KEY } from '@organizations/rbac/constants/rbac-metadata.constants';
import { OrganizationMembershipService } from '@organizations/services/organization-membership.service';
import { CreateProjectDto } from './dto/create-project.dto';
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
});
