import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { RequestWithTenantContext } from '../../common/tenant/types/request-with-tenant-context.type';
import { TenantScopedEntity } from '../entities/tenant-scoped.entity';
import { TenantScopedRepository } from './tenant-scoped.repository';

class TestProject extends TenantScopedEntity {
  name!: string;
}

class TestProjectRepository extends TenantScopedRepository<TestProject> {
  constructor(
    repository: Repository<TestProject>,
    tenantContext: TenantContextService,
  ) {
    super(tenantContext);
    this.repository = repository;
  }

  protected readonly repository: Repository<TestProject>;
}

describe('TenantScopedRepository', () => {
  let repository: jest.Mocked<
    Pick<
      Repository<TestProject>,
      | 'create'
      | 'createQueryBuilder'
      | 'find'
      | 'findOne'
      | 'findOneBy'
      | 'count'
      | 'save'
      | 'softRemove'
    >
  >;
  let tenantContext: TenantContextService;
  let scopedRepository: TestProjectRepository;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => value as TestProject),
      createQueryBuilder: jest.fn(() => ({
        alias: 'project',
        andWhere: jest.fn().mockReturnThis(),
      })),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    };

    const request = {
      tenantContext: { organizationId: 'org-123' },
    } as RequestWithTenantContext;
    tenantContext = new TenantContextService(request);
    scopedRepository = new TestProjectRepository(
      repository as unknown as Repository<TestProject>,
      tenantContext,
    );
  });

  it('creates entities with the active organization id', () => {
    scopedRepository.create({ name: 'Platform' });

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Platform',
      organizationId: 'org-123',
    });
  });

  it('scopes find queries by organization id', async () => {
    repository.find.mockResolvedValue([]);

    await scopedRepository.find({ where: { name: 'Platform' } });

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        name: 'Platform',
        organizationId: 'org-123',
      },
    });
  });

  it('scopes findOneById by organization id', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await scopedRepository.findOneById('project-1');

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: 'project-1',
      organizationId: 'org-123',
    });
  });

  it('rejects save when entity belongs to another organization', async () => {
    const project = {
      id: 'project-1',
      organizationId: 'org-999',
      name: 'Other org project',
    } as TestProject;

    await expect(scopedRepository.save(project)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
