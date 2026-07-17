import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/entities';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ default: false })
  isEmailVerified!: boolean;
}
