import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { InvitationsController } from './invitations.controller';
import { OrganizationMembersController } from './organization-members.controller';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { DevelopmentInvitationMailer } from './services/development-invitation-mailer.service';
import { InvitationsService } from './services/invitations.service';
import { OrganizationMembershipService } from './services/organization-membership.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, Invitation]),
  ],
  controllers: [
    OrganizationsController,
    OrganizationMembersController,
    InvitationsController,
  ],
  providers: [
    OrganizationsService,
    OrganizationMembershipService,
    InvitationsService,
    DevelopmentInvitationMailer,
    PermissionsGuard,
  ],
  exports: [
    OrganizationsService,
    OrganizationMembershipService,
    InvitationsService,
    DevelopmentInvitationMailer,
    PermissionsGuard,
    TypeOrmModule,
  ],
})
export class OrganizationsModule {}
