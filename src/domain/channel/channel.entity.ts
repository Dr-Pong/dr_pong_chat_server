import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ChannelType } from 'src/global/type/type.channel';

@Entity()
export class Channel extends BaseTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'operator' })
  operator: User;

  @Unique(['name'])
  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'max_headcount', nullable: false })
  maxHeadCount: number;

  @Column({ name: 'password', nullable: true })
  password: string;

  @Column({ name: 'type', nullable: false })
  type: ChannelType;
}
