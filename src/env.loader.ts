import { register } from 'tsconfig-paths';
import { config } from 'dotenv';
import { join } from 'path';

register({
  baseUrl: join(__dirname),
  paths: {
    '@app/*': ['*'],
    '@common/*': ['common/*'],
    '@config/*': ['config/*'],
    '@database/*': ['database/*'],
    '@health/*': ['modules/health/*'],
    '@authentication/*': ['modules/authentication/*'],
  },
});

config({ path: join(process.cwd(), '.env') });
