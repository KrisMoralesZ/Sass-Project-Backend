import { Test, TestingModule } from '@nestjs/testing';
import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '@common/errors';
import { OPTIONAL_ORGANIZATION_KEY } from '@common/tenant/constants/tenant-metadata.constants';
import type { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto';
import { InvitationsController } from './invitations.controller';
import { OrganizationRole } from './enums/organization-role.enum';
import { OrganizationPermission } from './permissions/organization-permission.enum';
import { REQUIRED_PERMISSIONS_KEY } from './rbac/constants/rbac-metadata.constants';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { InvitationsService } from './services/invitations.service';
import { OrganizationMembershipService } from './services/organization-membership.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let invitationsService: jest.Mocked<
    Pick<
      InvitationsService,
      | 'acceptInvitation'
      | 'createInvitation'
      | 'listInvitations'
      | 'revokeInvitation'
    >
  >;

  beforeEach(async () => {
    invitationsService = {
      acceptInvitation: jest.fn(),
      createInvitation: jest.fn(),
      listInvitations: jest.fn(),
      revokeInvitation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: invitationsService,
        },
        {
          provide: OrganizationMembershipService,
          useValue: {
            getActiveMembership: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(InvitationsController);
  });

  it('delegates creation to the invitations service', async () => {
    const dto = plainToInstance(CreateInvitationDto, {
      email: 'jane@example.com',
    });
    invitationsService.createInvitation.mockResolvedValue({
      id: 'invite-1',
      organizationId: 'org-1',
      email: 'jane@example.com',
      status: 'pending',
    } as never);

    await controller.create('org-1', { id: 'user-1' }, dto);

    expect(invitationsService.createInvitation).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      dto,
    );
  });

  it('delegates revocation to the invitations service', async () => {
    invitationsService.revokeInvitation.mockResolvedValue({
      id: 'invite-1',
      organizationId: 'org-1',
      email: 'jane@example.com',
      status: 'revoked',
    } as never);

    await controller.revoke('org-1', 'invite-1');

    expect(invitationsService.revokeInvitation).toHaveBeenCalledWith(
      'org-1',
      'invite-1',
    );
  });

  it('delegates acceptance to the invitations service', async () => {
    const dto = plainToInstance(AcceptInvitationDto, {
      token: 'raw-token-value-for-accept',
    });
    const user = { id: 'user-2', email: 'jane@example.com' };
    invitationsService.acceptInvitation.mockResolvedValue({
      invitation: { id: 'invite-1', status: 'accepted' },
      membership: { id: 'member-1', organizationId: 'org-1' },
    } as never);

    await controller.accept(user, dto);

    expect(invitationsService.acceptInvitation).toHaveBeenCalledWith(user, dto);
  });

  it('delegates list to the invitations service', async () => {
    const query = plainToInstance(ListInvitationsQueryDto, {
      page: 1,
      limit: 20,
      status: 'pending',
    });
    invitationsService.listInvitations.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    await controller.findAll('org-1', query);

    expect(invitationsService.listInvitations).toHaveBeenCalledWith(
      'org-1',
      query,
    );
  });
});

describe('InvitationsController RBAC', () => {
  const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const { prototype } = InvitationsController;

  // Route handlers are read as values here to inspect their decorator metadata.
  /* eslint-disable @typescript-eslint/unbound-method */
  const handlers = {
    accept: prototype.accept,
    create: prototype.create,
    findAll: prototype.findAll,
    revoke: prototype.revoke,
  } as const;
  /* eslint-enable @typescript-eslint/unbound-method */

  let guard: PermissionsGuard;
  let getActiveMembership: jest.Mock;

  const handlerMetadata = (key: string, handler: unknown): unknown =>
    Reflect.getMetadata(key, handler as object);

  const canActivateAs = (
    handler: unknown,
    role?: OrganizationRole,
  ): Promise<boolean> => {
    getActiveMembership.mockResolvedValue(role ? { role } : null);

    const request = {
      user: { id: 'user-1' },
      headers: {},
      tenantContext: { organizationId: ORGANIZATION_ID },
    } as unknown as RequestWithTenantContext;

    return guard.canActivate(
      new ExecutionContextHost(
        [request],
        InvitationsController,
        handler as never,
      ),
    );
  };

  beforeEach(() => {
    getActiveMembership = jest.fn();
    guard = new PermissionsGuard(new Reflector(), {
      getActiveMembership,
    } as unknown as OrganizationMembershipService);
  });

  it.each([
    ['create', handlers.create, OrganizationPermission.INVITE_CREATE],
    ['list', handlers.findAll, OrganizationPermission.INVITE_READ],
    ['revoke', handlers.revoke, OrganizationPermission.INVITE_REVOKE],
  ])('declares the invite permission on %s', (_label, handler, permission) => {
    expect(handlerMetadata(REQUIRED_PERMISSIONS_KEY, handler)).toEqual([
      permission,
    ]);
    expect(handlerMetadata(GUARDS_METADATA, handler)).toContain(
      PermissionsGuard,
    );
  });

  it('lets OWNER and ADMIN manage invites', async () => {
    for (const handler of [handlers.create, handlers.revoke]) {
      await expect(
        canActivateAs(handler, OrganizationRole.OWNER),
      ).resolves.toBe(true);
      await expect(
        canActivateAs(handler, OrganizationRole.ADMIN),
      ).resolves.toBe(true);
    }
  });

  it('blocks MEMBER and VIEWER from creating or revoking invites', async () => {
    for (const handler of [handlers.create, handlers.revoke]) {
      for (const role of [OrganizationRole.MEMBER, OrganizationRole.VIEWER]) {
        await expect(canActivateAs(handler, role)).rejects.toMatchObject({
          code: ErrorCode.FORBIDDEN,
        });
      }
    }
  });

  it('blocks MEMBER and VIEWER from listing invites', async () => {
    for (const role of [OrganizationRole.MEMBER, OrganizationRole.VIEWER]) {
      await expect(canActivateAs(handlers.findAll, role)).rejects.toMatchObject(
        { code: ErrorCode.FORBIDDEN },
      );
    }
  });

  it('rejects non-members of the active organization', async () => {
    await expect(canActivateAs(handlers.create)).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
  });

  it('requires no invite permission for accept', async () => {
    expect(
      handlerMetadata(REQUIRED_PERMISSIONS_KEY, handlers.accept),
    ).toBeUndefined();

    for (const role of [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MEMBER,
      OrganizationRole.VIEWER,
    ]) {
      await expect(canActivateAs(handlers.accept, role)).resolves.toBe(true);
    }

    expect(getActiveMembership).not.toHaveBeenCalled();
  });

  it('keeps accept on a static path outside tenant context', () => {
    expect(handlerMetadata(PATH_METADATA, handlers.accept)).toBe('accept');
    expect(handlerMetadata(METHOD_METADATA, handlers.accept)).toBe(
      RequestMethod.POST,
    );
    expect(handlerMetadata(OPTIONAL_ORGANIZATION_KEY, handlers.accept)).toBe(
      true,
    );
  });
});
