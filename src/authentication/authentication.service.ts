import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { AuthUserProfile, RegisterResponse } from './interfaces/auth.interface';
import { TokenService } from './token.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
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
    const tokens = this.tokenService.generateTokens(
      savedUser.id,
      savedUser.email,
    );

    return {
      user: this.toUserProfile(savedUser),
      tokens,
    };
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
