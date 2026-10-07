import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/authentication/entities/user.entity';
import { Invitation } from '../../modules/organizations/entities/invitation.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { OrganizationMember } from '../../modules/organizations/entities/organization-member.entity';
import { OrganizationRole } from '../../modules/organizations/enums/organization-role.enum';
import {
  getInvitationExpiresAt,
  INVITATION_PENDING_STATUS,
} from '../../modules/organizations/constants/organization-invitations-v1.policy';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../../modules/organizations/interfaces/organization-settings.interface';
import {
  DEFAULT_FRONTEND_ORIGIN,
  INVITATION_ACCEPT_PATH,
} from '../../modules/organizations/services/development-invitation-mailer.service';
import { hashInvitationToken } from '../../modules/organizations/utils/invitation-token.util';
import { UserProfile } from '../../modules/users/entities/user-profile.entity';
import { createDefaultUserProfilePreferences } from '../../modules/users/utils/user-profile-preferences.util';
import {
  SEED_INVITATION,
  SEED_ORGANIZATION,
  SEED_USER_PASSWORD,
  SEED_USERS,
} from './seed-data';

function buildInvitationAcceptUrl(token: string): string {
  const origin = (
    process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN
  ).replace(/\/+$/, '');

  return `${origin}${INVITATION_ACCEPT_PATH}?token=${encodeURIComponent(token)}`;
}

/**
 * Creates (or refreshes) the pending QA invitation.
 *
 * Terminal invitations are left untouched so re-seeding cannot resurrect an
 * invite that was already accepted or revoked.
 */
async function seedPendingInvitation(
  invitationsRepository: Repository<Invitation>,
  organizationId: string,
  invitedByUserId: string,
): Promise<Invitation['status']> {
  const tokenHash = hashInvitationToken(SEED_INVITATION.token);
  const existing = await invitationsRepository.findOne({
    where: { tokenHash },
  });

  if (!existing) {
    const invitation = await invitationsRepository.save(
      invitationsRepository.create({
        organizationId,
        email: SEED_INVITATION.email,
        role: SEED_INVITATION.role,
        tokenHash,
        status: INVITATION_PENDING_STATUS,
        invitedByUserId,
        expiresAt: getInvitationExpiresAt(),
      }),
    );

    console.log(
      `Created invitation for ${invitation.email} → ${organizationId} as ${invitation.role}`,
    );

    return invitation.status;
  }

  if (
    existing.status === INVITATION_PENDING_STATUS &&
    existing.expiresAt.getTime() <= Date.now()
  ) {
    existing.expiresAt = getInvitationExpiresAt();
    await invitationsRepository.save(existing);
    console.log(`Extended invitation expiry for ${existing.email}`);
  }

  return existing.status;
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const usersRepository = AppDataSource.getRepository(User);
  const profilesRepository = AppDataSource.getRepository(UserProfile);
  const organizationsRepository = AppDataSource.getRepository(Organization);
  const membersRepository = AppDataSource.getRepository(OrganizationMember);
  const invitationsRepository = AppDataSource.getRepository(Invitation);

  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, bcryptRounds);

  let inviterUserId = '';

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

    if (seedUser.role === OrganizationRole.OWNER) {
      inviterUserId = user.id;
    }
  }

  const invitationStatus = await seedPendingInvitation(
    invitationsRepository,
    organization.id,
    inviterUserId,
  );

  console.log('\nSeed complete.');
  console.log(`Organization ID: ${organization.id}`);
  console.log(`Password for all seed users: ${SEED_USER_PASSWORD}`);
  console.log('Users:');
  for (const seedUser of SEED_USERS) {
    console.log(`  - ${seedUser.email} (${seedUser.role})`);
  }
  console.log('\nPending invitation for local QA:');
  console.log(`  - ${SEED_INVITATION.email} (${invitationStatus})`);
  console.log(
    `  - accept URL: ${buildInvitationAcceptUrl(SEED_INVITATION.token)}`,
  );
  console.log('    Register with that email, then open the accept URL.');
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
