import { BaseTimeEntity } from 'src/global/base-entity/base-time.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DmLog extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'log', nullable: false })
  log: string;

  @Column({ name: 'time', nullable: false })
  time: Date;

  @Column({ name: 'sender', nullable: false })
  sender: number;
}
