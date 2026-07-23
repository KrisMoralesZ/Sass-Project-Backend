import { register } from 'tsconfig-paths';
import { config } from 'dotenv';
import { join } from 'path';

register({
  baseUrl: join(__dirname),
  paths: {
    '@common/*': ['common/*'],
    '@config/*': ['config/*'],
    '@authentication/*': ['authentication/*'],
    '@database/*': ['database/*'],
    '@health/*': ['modules/health/*'],
  },
});

config({ path: join(process.cwd(), '.env') });
