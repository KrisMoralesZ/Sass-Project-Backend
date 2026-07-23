import { OrganizationMember } from '@organizations/entities/organization-member.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  displayName!: string | null;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @OneToMany(() => OrganizationMember, (membership) => membership.user)
  memberships!: OrganizationMember[];
}
