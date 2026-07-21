import { OrganizationPlan } from '../enums/organization-plan.enum';
import { OrganizationSettings } from '../interfaces/organization-settings.interface';

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}
