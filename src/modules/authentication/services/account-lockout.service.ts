import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException, ErrorCode } from '../../common/errors';
import { User } from '../entities/user.entity';

@Injectable()
export class AccountLockoutService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  assertNotLocked(user: User): void {
    if (!this.isLocked(user)) {
      return;
    }

    throw AppException.forbidden(
      ErrorCode.ACCOUNT_LOCKED,
      'Account temporarily locked due to too many failed login attempts. Try again later.',
    );
  }

  isLocked(user: User): boolean {
    return Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now());
  }

  async recordFailedAttempt(user: User): Promise<void> {
    const maxAttempts = this.configService.get<number>(
      'auth.maxFailedLoginAttempts',
      5,
    );
    const lockoutMinutes = this.configService.get<number>(
      'auth.lockoutMinutes',
      15,
    );

    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      failedLoginAttempts >= maxAttempts
        ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
        : user.lockedUntil;

    await this.usersRepository.update(user.id, {
      failedLoginAttempts,
      lockedUntil,
    });
  }

  async resetAttempts(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }
}
