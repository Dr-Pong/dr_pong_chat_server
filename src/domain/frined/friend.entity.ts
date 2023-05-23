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

  @Column({ name: 'room_id', nullable: false })
  roomId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'friend_id' })
  friend: User;

  @Column({ name: 'status', nullable: false })
  status: FriendType;

  @Column({ name: 'chat_on', nullable: false })
  isChatOn: boolean;
}
