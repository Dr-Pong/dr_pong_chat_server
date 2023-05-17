import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class BaseTimeEntity {
  @CreateDateColumn({ name: 'created_at', type: 'date' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'date' })
  updatedAt: Date;
}
