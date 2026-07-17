import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/app-config.module';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { User } from './entities/user.entity';
import { TokenService } from './token.service';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtAccessSecret'),
      }),
    }),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, TokenService],
  exports: [AuthenticationService, TokenService, JwtModule],
})
export class AuthenticationModule {}
