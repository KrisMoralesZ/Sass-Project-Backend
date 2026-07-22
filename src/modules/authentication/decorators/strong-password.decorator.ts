import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
} from '../constants/password.constants';

export function StrongPasswordProperty(options?: { example?: string }) {
  return applyDecorators(
    ApiProperty({
      example: options?.example ?? 'Password1',
      description:
        'Minimum 8 characters with at least one uppercase letter, one lowercase letter, and one number',
    }),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_PATTERN, {
      message: PASSWORD_VALIDATION_MESSAGE,
    }),
  );
}
