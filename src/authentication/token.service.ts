import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
import { RefreshToken } from './entities/refresh-token.entity';
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
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessExpiresIn =
      this.configService.get<string>('auth.jwtAccessExpiresIn') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<string>('auth.jwtRefreshExpiresIn') ?? '7d';
    const tokenId = randomUUID();

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
        jti: tokenId,
      },
      {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId,
        tokenId,
        expiresAt: new Date(
          Date.now() + this.parseExpiresInSeconds(refreshExpiresIn) * 1000,
        ),
        revokedAt: null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresInSeconds(accessExpiresIn),
    };
  }

  async validateRefreshToken(refreshToken: string): Promise<{
    userId: string;
    tokenId: string;
  }> {
    let payload: JwtRefreshPayload;

    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      });
    } catch {
      throw AppException.unauthorized('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    const storedToken = await this.refreshTokensRepository.findOne({
      where: {
        tokenId: payload.jti,
        userId: payload.sub,
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt.getTime() <= Date.now()
    ) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    return {
      userId: payload.sub,
      tokenId: payload.jti,
    };
  }

  async revokeTokenById(tokenId: string): Promise<void> {
    await this.refreshTokensRepository.update(
      { tokenId },
      { revokedAt: new Date() },
    );
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const { tokenId } = await this.validateRefreshToken(refreshToken);
      await this.revokeTokenById(tokenId);
    } catch {
      // Logout is idempotent when the token is already invalid.
    }
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
