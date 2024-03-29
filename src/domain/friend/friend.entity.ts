import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { FriendType } from 'src/global/type/type.friend.status';

@Entity()
export class Friend extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  sender: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'friend_id' })
  receiver: User;

  @Column({ name: 'status', nullable: false })
  status: FriendType;
}
