import { SetMetadata } from '@nestjs/common';
import { OPTIONAL_ORGANIZATION_KEY } from '../constants/tenant-metadata.constants';

export const OptionalOrganization = () =>
  SetMetadata(OPTIONAL_ORGANIZATION_KEY, true);
