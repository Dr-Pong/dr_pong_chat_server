import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import { Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

export class FriendDirectMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @Column({ name: 'user_id', nullable: false })
  userId: User;

  @ManyToOne(() => User, { eager: true })
  @Column({ name: 'friend_id', nullable: false })
  friendId: User;

  @Column({ name: 'room_id', nullable: false })
  roomId: string;

  @Column({ name: 'last_message_id', nullable: false })
  lastMessageId: number;

  @Column({ name: 'is_chat_on', nullable: false })
  isChatOn: boolean;
}
