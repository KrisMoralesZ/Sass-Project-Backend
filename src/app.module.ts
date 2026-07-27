import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@authentication/authentication.module';
import { LoggingModule } from '@common/logging/logging.module';
import { SecurityModule } from '@common/security/security.module';
import { TenantModule } from '@common/tenant/tenant.module';
import { AppConfigModule } from '@config/app-config.module';
import { DatabaseModule } from '@database/database.module';
import { HealthModule } from '@health/health.module';
import { OrganizationsModule } from '@organizations/organizations.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LoggingModule,
    SecurityModule,
    // JwtAuthGuard must register before TenantGuard so membership checks see request.user
    AuthenticationModule,
    TenantModule,
    HealthModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
