import type { ProjectStatus } from '../enums/project-status.enum';
import type { ProjectMetadata } from './project-metadata.interface';

export interface ProjectResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  ownerId: string;
  status: ProjectStatus;
  metadata: ProjectMetadata;
  createdAt: Date;
  updatedAt: Date;
}
