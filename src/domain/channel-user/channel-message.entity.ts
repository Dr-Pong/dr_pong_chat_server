import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Channel } from '../channel/channel.entity';
import { User } from '../user/user.entity';
import { ChatType } from 'src/global/type/type.chat';

export class ChannelMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'channel_id' })
  @ManyToOne(() => Channel)
  channel: Channel;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ name: 'time' })
  time: Date;

  @Column({ name: 'content' })
  content: string;

  @Column({ name: 'type' })
  type: ChatType;
}
