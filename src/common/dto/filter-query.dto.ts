import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Free-text search applied by the endpoint',
    example: 'platform',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
