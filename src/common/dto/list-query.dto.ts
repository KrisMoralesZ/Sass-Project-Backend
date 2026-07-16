import { IntersectionType } from '@nestjs/swagger';
import { FilterQueryDto } from './filter-query.dto';
import { PaginationQueryDto } from './pagination-query.dto';
import { SortQueryDto } from './sort-query.dto';

export class ListQueryDto extends IntersectionType(
  PaginationQueryDto,
  SortQueryDto,
  FilterQueryDto,
) {}
