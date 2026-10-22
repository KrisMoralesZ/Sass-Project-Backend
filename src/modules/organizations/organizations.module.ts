import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationMembersController } from './organization-members.controller';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { DevelopmentInvitationMailer } from './services/development-invitation-mailer.service';
import { OrganizationMembershipService } from './services/organization-membership.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, Invitation]),
  ],
  controllers: [OrganizationsController, OrganizationMembersController],
  providers: [
    OrganizationsService,
    OrganizationMembershipService,
    DevelopmentInvitationMailer,
    PermissionsGuard,
  ],
  exports: [
    OrganizationsService,
    OrganizationMembershipService,
    DevelopmentInvitationMailer,
    PermissionsGuard,
    TypeOrmModule,
  ],
})
export class OrganizationsModule {}
