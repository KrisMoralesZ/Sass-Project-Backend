import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UserProfileNotificationPreferencesDto } from './user-profile-notification-preferences.dto';

export class UserProfilePreferencesDto {
  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'IANA timezone for the user profile.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'BCP 47 locale for the user profile.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @ApiPropertyOptional({
    example: 'system',
    enum: ['system', 'light', 'dark'],
  })
  @IsOptional()
  @IsIn(['system', 'light', 'dark'])
  theme?: 'system' | 'light' | 'dark';

  @ApiPropertyOptional({ type: UserProfileNotificationPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileNotificationPreferencesDto)
  notifications?: UserProfileNotificationPreferencesDto;
}
