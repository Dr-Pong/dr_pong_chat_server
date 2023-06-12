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
import {
  CHANNEL_PARTICIPANT_NORMAL,
  ChannelParticipantType,
} from '../type/type.channel-participant';

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

  @Column({ name: 'role_type', default: CHANNEL_PARTICIPANT_NORMAL })
  roleType: ChannelParticipantType;

  @Column({ name: 'is_muted', default: false })
  isMuted: boolean;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;
}
