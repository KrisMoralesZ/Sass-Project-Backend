import { ListQueryDto } from '@common/dto/list-query.dto';

export class ListProjectsQueryDto extends ListQueryDto {}

export const PROJECT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'status',
] as const;

export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];
