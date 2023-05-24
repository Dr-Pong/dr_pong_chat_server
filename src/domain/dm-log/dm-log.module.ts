import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DmLog } from './dm-log.entity';
import { DmLogService } from './dm-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([DmLog])],
  providers: [DmLogService],
  exports: [DmLogService],
  controllers: [],
})
export class DmLogModule {}
