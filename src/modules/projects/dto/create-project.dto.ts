import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { ProjectMetadata } from '../interfaces/project-metadata.interface';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website redesign' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Redesign the company website.' })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Application-specific project metadata.',
  })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsObject()
  metadata?: ProjectMetadata;
}
