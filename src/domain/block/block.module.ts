import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { BlockService } from './block.service';
import { BlockRepository } from './block.repository';
import { FactoryModule } from '../factory/factory.module';
import { BlockController } from './controller/block.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Block]), FactoryModule, UserModule],
  providers: [BlockService, BlockRepository],
  exports: [BlockService],
  controllers: [BlockController],
})
export class BlockModule {}
