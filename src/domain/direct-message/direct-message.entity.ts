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
export class DirectMessage extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  sender: User;

  @Column({ name: 'room_id', nullable: false })
  roomId: string;

  @Column({ name: 'message', nullable: false })
  message: string;

  @Column({ name: 'time', nullable: false })
  time: Date;
}
