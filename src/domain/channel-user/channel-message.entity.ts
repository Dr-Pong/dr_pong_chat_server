import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import { Column, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';

export class ChannelMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'channel_id' })
  channelId: number;

  @JoinColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'time' })
  time: Date;

  @Column({ name: 'content' })
  content: string;

  @Column({ name: 'type' })
  type: ChatType;
}
