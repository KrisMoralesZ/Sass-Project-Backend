import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { User } from '../modules/authentication/entities/user.entity';
import { RefreshToken } from '../modules/authentication/entities/refresh-token.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { OrganizationMember } from '../modules/organizations/entities/organization-member.entity';
import { UserProfile } from '../modules/users/entities/user-profile.entity';

config({ path: join(process.cwd(), '.env') });

/**
 * Standalone TypeORM data source for CLI scripts (seeds).
 * Keep entity list in sync with modules that use TypeOrmModule.forFeature.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'sass_project',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  entities: [User, RefreshToken, Organization, OrganizationMember, UserProfile],
});

export default AppDataSource;
