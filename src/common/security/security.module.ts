import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  AUTH_THROTTLE_NAME,
  AUTH_THROTTLE_PATHS,
} from './throttle.constants';
import { AppConfigModule } from '@config/app-config.module';
import { AppThrottlerGuard } from '@common/guards/app-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('throttle.defaultTtlMs', 60_000),
          limit: configService.get<number>('throttle.defaultLimit', 120),
        },
        {
          name: AUTH_THROTTLE_NAME,
          ttl: configService.get<number>('throttle.authTtlMs', 60_000),
          limit: configService.get<number>('throttle.authLimit', 5),
          skipIf: (context) => {
            const request = context.switchToHttp().getRequest<{
              originalUrl?: string;
              url?: string;
            }>();
            const path = request.originalUrl ?? request.url ?? '';
            return !AUTH_THROTTLE_PATHS.some((authPath) =>
              path.includes(authPath),
            );
          },
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class SecurityModule {}
