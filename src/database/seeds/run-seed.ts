import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/authentication/entities/user.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { OrganizationMember } from '../../modules/organizations/entities/organization-member.entity';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../../modules/organizations/interfaces/organization-settings.interface';
import { UserProfile } from '../../modules/users/entities/user-profile.entity';
import { createDefaultUserProfilePreferences } from '../../modules/users/utils/user-profile-preferences.util';
import { SEED_ORGANIZATION, SEED_USER_PASSWORD, SEED_USERS } from './seed-data';

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const usersRepository = AppDataSource.getRepository(User);
  const profilesRepository = AppDataSource.getRepository(UserProfile);
  const organizationsRepository = AppDataSource.getRepository(Organization);
  const membersRepository = AppDataSource.getRepository(OrganizationMember);

  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, bcryptRounds);

  let organization = await organizationsRepository.findOne({
    where: { slug: SEED_ORGANIZATION.slug },
  });

  if (!organization) {
    organization = await organizationsRepository.save(
      organizationsRepository.create({
        name: SEED_ORGANIZATION.name,
        slug: SEED_ORGANIZATION.slug,
        plan: SEED_ORGANIZATION.plan,
        settings: { ...DEFAULT_ORGANIZATION_SETTINGS },
      }),
    );
    console.log(
      `Created organization ${organization.slug} (${organization.id})`,
    );
  } else {
    console.log(
      `Organization ${organization.slug} already exists (${organization.id})`,
    );
  }

  for (const seedUser of SEED_USERS) {
    let user = await usersRepository.findOne({
      where: { email: seedUser.email },
    });

    if (!user) {
      user = await usersRepository.save(
        usersRepository.create({
          email: seedUser.email,
          passwordHash,
          displayName: seedUser.displayName,
          failedLoginAttempts: 0,
          lockedUntil: null,
        }),
      );
      console.log(`Created user ${user.email}`);
    } else {
      user.displayName = seedUser.displayName;
      await usersRepository.save(user);
      console.log(`Updated user ${user.email}`);
    }

    let profile = await profilesRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await profilesRepository.save(
        profilesRepository.create({
          userId: user.id,
          displayName: seedUser.displayName,
          avatarUrl: null,
          preferences: createDefaultUserProfilePreferences(),
        }),
      );
      console.log(`Created profile for ${user.email}`);
    } else {
      profile.displayName = seedUser.displayName;
      await profilesRepository.save(profile);
    }

    let membership = await membersRepository.findOne({
      where: {
        organizationId: organization.id,
        userId: user.id,
      },
    });

    if (!membership) {
      membership = await membersRepository.save(
        membersRepository.create({
          organizationId: organization.id,
          userId: user.id,
          role: seedUser.role,
        }),
      );
      console.log(
        `Created membership ${user.email} → ${organization.slug} as ${membership.role}`,
      );
    } else if (membership.role !== seedUser.role) {
      membership.role = seedUser.role;
      await membersRepository.save(membership);
      console.log(
        `Updated membership ${user.email} → ${organization.slug} as ${membership.role}`,
      );
    } else {
      console.log(
        `Membership ${user.email} → ${organization.slug} already ${membership.role}`,
      );
    }
  }

  console.log('\nSeed complete.');
  console.log(`Organization ID: ${organization.id}`);
  console.log(`Password for all seed users: ${SEED_USER_PASSWORD}`);
  console.log('Users:');
  for (const seedUser of SEED_USERS) {
    console.log(`  - ${seedUser.email} (${seedUser.role})`);
  }
}

seed()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
