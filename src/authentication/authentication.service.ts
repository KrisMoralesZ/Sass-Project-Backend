import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { AppException, ErrorCode } from '../common/errors';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshAuthDto } from './dto/refresh-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthenticationService {
  private readonly failedLoginAttempts = new Map<string, number>();
  private readonly lockoutUntil = new Map<string, number>();

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

    const passwordHash = await this.hashPassword(dto.password);
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
    const normalizedEmail = dto.email.toLowerCase();
    const now = Date.now();
    const lockoutUntilValue = this.lockoutUntil.get(normalizedEmail) ?? 0;

    if (lockoutUntilValue > now) {
      throw AppException.unauthorized(
        'Too many failed login attempts. Try again later.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.registerFailedAttempt(normalizedEmail);
      throw AppException.unauthorized('Invalid email or password');
    }

    const isValidPassword = await this.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      this.registerFailedAttempt(normalizedEmail);
      throw AppException.unauthorized('Invalid email or password');
    }

    this.failedLoginAttempts.delete(normalizedEmail);
    this.lockoutUntil.delete(normalizedEmail);

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

  private registerFailedAttempt(email: string): void {
    const currentAttempts = (this.failedLoginAttempts.get(email) ?? 0) + 1;
    this.failedLoginAttempts.set(email, currentAttempts);

    if (currentAttempts >= 5) {
      this.lockoutUntil.set(email, Date.now() + 15 * 60 * 1000);
      this.failedLoginAttempts.delete(email);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  private createToken(userId: string, type: 'access' | 'refresh'): string {
    return `${type}-token-for-${userId}`;
  }
}
