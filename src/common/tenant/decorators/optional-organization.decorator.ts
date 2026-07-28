import { SetMetadata } from '@nestjs/common';
import { OPTIONAL_ORGANIZATION_KEY } from '@common/tenant/constants/tenant-metadata.constants';

export const OptionalOrganization = () =>
  SetMetadata(OPTIONAL_ORGANIZATION_KEY, true);
