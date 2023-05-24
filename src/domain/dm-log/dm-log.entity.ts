import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class DmLog extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @Column({ name: 'sender', nullable: false })
  sender: User;

  @Column({ name: 'room_id', nullable: false })
  roomId: string;

  @Column({ name: 'log', nullable: false })
  log: string;

  @Column({ name: 'time', nullable: false })
  time: Date;
}
