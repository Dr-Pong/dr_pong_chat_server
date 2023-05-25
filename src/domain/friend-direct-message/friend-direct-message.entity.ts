import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class FriendDirectMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  userId: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'friend_id' })
  friendId: User;

  @Column({ name: 'room_id', nullable: false })
  roomId: string;

  @Column({ name: 'last_message_id', nullable: false })
  lastMessageId: number;

  @Column({ name: 'is_chat_on', nullable: false })
  isChatOn: boolean;
}
