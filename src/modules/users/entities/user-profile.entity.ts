import { User } from '@authentication/entities/user.entity';
import { BaseEntity } from '@database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

/**
 * Profile data for a global user identity.
 *
 * Auth credentials live on {@link User}; profile presentation fields live here.
 * Additional fields (avatar, preferences) are added in task 3.1.2.
 *
 * @see ../../../../docs/next-tasks-and-subtasks.md
 */
@Entity('user_profiles')
export class UserProfile extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 120, nullable: true })
  displayName!: string | null;
}
