import { Module } from '@nestjs/common';
import { TenantModule } from './common/tenant/tenant.module';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, TenantModule, HealthModule],
})
export class AppModule {}
