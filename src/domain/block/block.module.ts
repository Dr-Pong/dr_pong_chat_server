import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { BlockService } from './block.service';
import { BlockRepository } from './block.repository';
import { FactoryModule } from '../factory/factory.module';

@Module({
  imports: [TypeOrmModule.forFeature([Block]), FactoryModule],
  providers: [BlockService, BlockRepository],
  exports: [BlockService],
})
export class BlockModule {}
