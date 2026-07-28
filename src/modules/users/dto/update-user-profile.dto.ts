import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UserProfilePreferencesDto } from './user-profile-preferences.dto';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    example: 'Jane Owner',
    description: 'Public display name for the user profile.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/jane.png',
    description: 'Public avatar image URL.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  avatarUrl?: string | null;

  @ApiPropertyOptional({ type: UserProfilePreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfilePreferencesDto)
  preferences?: UserProfilePreferencesDto;
}
