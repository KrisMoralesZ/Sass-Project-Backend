import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
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

    return {
      accessToken: this.createToken(savedUser.id, 'access'),
      refreshToken: this.createToken(savedUser.id, 'refresh'),
      user: {
        id: savedUser.id,
        email: savedUser.email,
        displayName: savedUser.displayName,
        isEmailVerified: savedUser.isEmailVerified,
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
