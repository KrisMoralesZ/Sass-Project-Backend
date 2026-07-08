import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenantGuard } from './guards/tenant.guard';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { TenantContextController } from './tenant-context.controller';
import { TenantContextResolver } from './tenant-context.resolver';
import { TenantContextService } from './tenant-context.service';
import { TenantMembershipValidator } from './tenant-membership.validator';

@Global()
@Module({
  controllers: [TenantContextController],
  providers: [
    TenantContextResolver,
    TenantContextService,
    TenantMembershipValidator,
    TenantGuard,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [
    TenantContextResolver,
    TenantContextService,
    TenantMembershipValidator,
    TenantGuard,
  ],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
