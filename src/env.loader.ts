import { register } from 'tsconfig-paths';
import { config } from 'dotenv';
import { join } from 'path';

register({
  baseUrl: join(__dirname),
  paths: { '@/*': ['*'] },
});

config({ path: join(process.cwd(), '.env') });
