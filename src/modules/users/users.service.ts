import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { AppException } from '@common/errors';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfile } from './entities/user-profile.entity';
import { UserProfileResponse } from './interfaces/user-profile-response.interface';
import {
  createDefaultUserProfilePreferences,
  mergeUserProfilePreferences,
  normalizeUserProfilePreferences,
} from './utils/user-profile-preferences.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profilesRepository: Repository<UserProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async createProfileForUser(
    userId: string,
    displayName: string | null = null,
  ): Promise<UserProfile> {
    const existing = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const profile = this.profilesRepository.create({
      userId,
      displayName,
      avatarUrl: null,
      preferences: createDefaultUserProfilePreferences(),
    });

    return this.profilesRepository.save(profile);
  }

  async getMyProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.findUserById(userId);
    const profile = await this.ensureProfile(user);

    return this.toResponse(user, profile);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.findUserById(userId);
    const profile = await this.ensureProfile(user);

    const nextDisplayName =
      dto.displayName === undefined
        ? undefined
        : dto.displayName === null
          ? null
          : dto.displayName.trim();

    if (nextDisplayName !== undefined && nextDisplayName === '') {
      throw AppException.validationFailed('displayName must not be empty');
    }

    const nextAvatarUrl =
      dto.avatarUrl === undefined
        ? undefined
        : dto.avatarUrl === null
          ? null
          : dto.avatarUrl.trim();

    if (nextAvatarUrl !== undefined && nextAvatarUrl === '') {
      throw AppException.validationFailed('avatarUrl must not be empty');
    }

    const shouldUpdateDisplayName = nextDisplayName !== undefined;
    const shouldUpdateAvatar = nextAvatarUrl !== undefined;
    const shouldUpdatePreferences = dto.preferences !== undefined;

    if (
      !shouldUpdateDisplayName &&
      !shouldUpdateAvatar &&
      !shouldUpdatePreferences
    ) {
      return this.toResponse(user, profile);
    }

    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const profilesRepository = manager.getRepository(UserProfile);

      if (shouldUpdateDisplayName) {
        user.displayName = nextDisplayName;
        profile.displayName = nextDisplayName;
        await usersRepository.save(user);
      }

      if (shouldUpdateAvatar) {
        profile.avatarUrl = nextAvatarUrl;
      }

      if (shouldUpdatePreferences && dto.preferences) {
        profile.preferences = mergeUserProfilePreferences(
          profile.preferences,
          dto.preferences,
        );
      }

      await profilesRepository.save(profile);
    });

    return this.toResponse(user, profile);
  }

  private async ensureProfile(user: User): Promise<UserProfile> {
    return this.createProfileForUser(user.id, user.displayName);
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.notFound('User not found');
    }

    return user;
  }

  private toResponse(user: User, profile: UserProfile): UserProfileResponse {
    return {
      id: profile.id,
      userId: user.id,
      email: user.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      preferences: normalizeUserProfilePreferences(profile.preferences),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
