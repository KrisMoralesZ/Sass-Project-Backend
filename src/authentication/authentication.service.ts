import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException, ErrorCode } from '../common/errors';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshAuthDto } from './dto/refresh-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: RegisterAuthDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw AppException.conflict('Email already registered');
    }

    const passwordHash = this.hashPassword(dto.password);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    return this.buildAuthResponse(savedUser);
  }

  async login(dto: LoginAuthDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || user.passwordHash !== this.hashPassword(dto.password)) {
      throw AppException.unauthorized('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshAuthDto) {
    if (!dto.refreshToken || !dto.refreshToken.includes('refresh-token-for-')) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    const userId = dto.refreshToken.split('refresh-token-for-').pop();
    if (!userId) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    return this.buildAuthResponse(user);
  }

  logout(authHeader?: string): void {
    if (!authHeader) {
      throw AppException.badRequest(
        ErrorCode.UNAUTHORIZED,
        'Authorization header is required',
      );
    }
  }

  async me(authHeader?: string) {
    if (!authHeader) {
      throw AppException.unauthorized('Authorization header is required');
    }

    const userId = authHeader.replace('Bearer ', '').replace('bearer ', '');
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw AppException.unauthorized('Invalid token');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isEmailVerified: user.isEmailVerified,
    };
  }

  private buildAuthResponse(user: User) {
    return {
      accessToken: this.createToken(user.id, 'access'),
      refreshToken: this.createToken(user.id, 'refresh'),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  private hashPassword(password: string): string {
    return `hashed:${password}`;
  }

  private createToken(userId: string, type: 'access' | 'refresh'): string {
    return `${type}-token-for-${userId}`;
  }
}
