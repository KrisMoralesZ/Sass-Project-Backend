import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env') });

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_HOST ??= 'localhost';
process.env.DATABASE_PORT ??= '5432';
process.env.DATABASE_USER ??= 'postgres';
process.env.DATABASE_PASSWORD ??= 'postgres';
process.env.DATABASE_NAME ??= 'sass_project';
process.env.DATABASE_SSL ??= 'false';
process.env.DATABASE_SYNCHRONIZE ??= 'true';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-min-32-characters-long';
