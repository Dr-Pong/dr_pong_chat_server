import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import { ChannelActionType } from 'src/domain/channel/type/type.channel.action';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Channel } from './channel.entity';

@Entity()
export class ChannelMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'channel_id' })
  @ManyToOne(() => Channel, { eager: true })
  channel: Channel;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ name: 'time', nullable: false })
  time: Date;

  @Column({ name: 'content' })
  content: string;

  @Column({ name: 'type', nullable: false })
  type: ChannelActionType;
}
