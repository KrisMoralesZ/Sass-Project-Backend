import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import {
  AuthUserProfile,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  RegisterResponse,
} from './interfaces/auth.interface';
import { TokenService } from './token.service';
import { AccountLockoutService } from './services/account-lockout.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly accountLockoutService: AccountLockoutService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw AppException.conflict('Email is already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = this.usersRepository.create({
      email: normalizedEmail,
      passwordHash,
      displayName: dto.displayName?.trim() ?? null,
    });

    const savedUser = await this.usersRepository.save(user);
    const tokens = await this.tokenService.generateTokens(
      savedUser.id,
      savedUser.email,
    );

    return {
      user: this.toUserProfile(savedUser),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw AppException.unauthorized('Invalid email or password');
    }

    this.accountLockoutService.assertNotLocked(user);

    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.accountLockoutService.recordFailedAttempt(user);
      throw AppException.unauthorized('Invalid email or password');
    }

    await this.accountLockoutService.resetAttempts(user.id);
    const tokens = await this.tokenService.generateTokens(user.id, user.email);

    return {
      user: this.toUserProfile(user),
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<RefreshResponse> {
    const { userId, tokenId } = await this.tokenService.validateRefreshToken(
      dto.refreshToken,
    );

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    await this.tokenService.revokeTokenById(tokenId);
    const tokens = await this.tokenService.generateTokens(user.id, user.email);

    return { tokens };
  }

  async logout(dto: RefreshTokenDto): Promise<LogoutResponse> {
    await this.tokenService.revokeRefreshToken(dto.refreshToken);

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string): Promise<AuthUserProfile> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.unauthorized('User not found');
    }

    return this.toUserProfile(user);
  }

  private async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('auth.bcryptRounds', 12);
    return bcrypt.hash(password, rounds);
  }

  private toUserProfile(user: User): AuthUserProfile {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
  }
}
