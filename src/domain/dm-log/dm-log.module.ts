import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DmLog } from './dm-log.entity';
import { DmLogService } from './dm-log.service';
import { DmLogRepository } from './dm-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DmLog])],
  providers: [DmLogService],
  exports: [DmLogService, DmLogRepository],
  controllers: [],
})
export class DmLogModule {}
