import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuthTokens,
  JwtAccessPayload,
  JwtRefreshPayload,
} from './interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(userId: string, email: string): AuthTokens {
    const accessExpiresIn =
      this.configService.get<string>('auth.jwtAccessExpiresIn') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<string>('auth.jwtRefreshExpiresIn') ?? '7d';

    const accessToken = this.jwtService.sign<JwtAccessPayload>(
      {
        sub: userId,
        email,
        type: 'access',
      },
      {
        secret: this.configService.get<string>('auth.jwtAccessSecret'),
        expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = this.jwtService.sign<JwtRefreshPayload>(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresInSeconds(accessExpiresIn),
    };
  }

  private parseExpiresInSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());

    if (!match) {
      return 900;
    }

    const amount = Number.parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return 900;
    }
  }
}
