import { BaseTimeEntity } from 'global/base-entity/base-time.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Friend extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'friend_id' })
  friend: User;
}
