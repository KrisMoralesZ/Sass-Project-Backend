import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '@config/app-config.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sslValue = configService.get<string | boolean>('database.ssl');
        const sslEnabled = sslValue === true || sslValue === 'true';
        const host = configService.get<string>('database.host');
        const port = configService.get<number>('database.port');
        const username = configService.get<string>('database.username');
        const password = configService.get<string>('database.password');
        const database = configService.get<string>('database.name');
        const synchronizeValue = configService.get<string | boolean>(
          'database.synchronize',
        );
        const synchronize =
          synchronizeValue === true || synchronizeValue === 'true';

        if (!host || !username || !database) {
          throw new Error(
            'Database configuration is incomplete. Ensure .env is loaded (see .env.example).',
          );
        }

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
          autoLoadEntities: true,
          synchronize,
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
