import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
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
export class ChannelUser extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Channel, { eager: true })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
}
