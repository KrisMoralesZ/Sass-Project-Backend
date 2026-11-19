import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ProjectStatus } from '../enums/project-status.enum';
import type { ProjectMetadata } from '../interfaces/project-metadata.interface';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Website redesign' })
  @ValidateIf((_dto, value) => value !== undefined)
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Redesign the company website.' })
  @ValidateIf((_dto, value) => value !== undefined)
  @ValidateIf((_dto, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsObject()
  metadata?: ProjectMetadata;
}
