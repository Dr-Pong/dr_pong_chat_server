import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { ChannelType } from 'src/domain/channel/type/type.channel';

@Entity()
export class Channel extends BaseTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'operator' })
  operator: User;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'max_headcount', nullable: false })
  maxHeadCount: number;

  @Column({ name: 'headcount', nullable: false, default: 0 })
  headCount: number;

  @Column({ name: 'password', nullable: true, default: null })
  password: string;

  @Column({ name: 'type', nullable: false })
  type: ChannelType;

  @Column({ name: 'is_deleted', nullable: false, default: false })
  isDeleted: boolean;
}
