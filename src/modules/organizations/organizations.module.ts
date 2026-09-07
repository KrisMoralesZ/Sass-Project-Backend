import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationMembersController } from './organization-members.controller';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { OrganizationMembershipService } from './services/organization-membership.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMember])],
  controllers: [OrganizationsController, OrganizationMembersController],
  providers: [
    OrganizationsService,
    OrganizationMembershipService,
    PermissionsGuard,
  ],
  exports: [
    OrganizationsService,
    OrganizationMembershipService,
    PermissionsGuard,
    TypeOrmModule,
  ],
})
export class OrganizationsModule {}
