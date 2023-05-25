import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { FriendDirectMessage } from '../friend-direct-message/friend-direct-message.entity';

@Entity()
export class DirectMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  sender: User;

  @ManyToOne(() => FriendDirectMessage, { eager: true })
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  roomId: FriendDirectMessage;

  @Column({ name: 'message', nullable: false })
  message: string;

  @Column({ name: 'time', nullable: false })
  time: Date;
}
