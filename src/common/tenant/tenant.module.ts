import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { TenantContextResolver } from './tenant-context.resolver';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  providers: [TenantContextResolver, TenantContextService],
  exports: [TenantContextResolver, TenantContextService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
