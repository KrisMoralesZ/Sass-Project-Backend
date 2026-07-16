import { Module } from '@nestjs/common';
import { LoggingModule } from './common/logging/logging.module';
import { TenantModule } from './common/tenant/tenant.module';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LoggingModule,
    TenantModule,
    HealthModule,
    AuthenticationModule,
  ],
})
export class AppModule {}
