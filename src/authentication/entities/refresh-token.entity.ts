import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenId!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
