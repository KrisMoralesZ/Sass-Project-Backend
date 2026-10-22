import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Bounds for the opaque invite token accepted by `POST /invites/accept`.
 * v1 tokens are URL-safe base64 of 32 random bytes (43 characters); the
 * bounds are intentionally loose so the encoding can change without a
 * breaking API change.
 */
export const INVITATION_TOKEN_MIN_LENGTH = 20;
export const INVITATION_TOKEN_MAX_LENGTH = 255;

/**
 * Body of `POST /invites/accept` (task 3.3.3).
 *
 * Accept is authenticated but not tenant-scoped, so this DTO carries no
 * organization reference. The raw token is only ever compared against the
 * stored SHA-256 hash.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 */
export class AcceptInvitationDto {
  @ApiProperty({
    description:
      'Raw invite token from the accept URL. Only its SHA-256 hash is stored.',
    example: 'kZ3vQ1sJ8xN0bW5yT7pR2mH4cA6dE9fG1iL3oP5sU7w',
  })
  @IsString()
  @MinLength(INVITATION_TOKEN_MIN_LENGTH)
  @MaxLength(INVITATION_TOKEN_MAX_LENGTH)
  token!: string;
}
