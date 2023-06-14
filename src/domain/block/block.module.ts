import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { BlockService } from './block.service';
import { BlockRepository } from './block.repository';
import { FactoryModule } from '../factory/factory.module';
import { BlockController } from './controller/block.controller';
import { UserModule } from '../user/user.module';
import { Friend } from '../friend/friend.entity';
import { FriendRepository } from '../friend/friend.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block, Friend]),
    FactoryModule,
    UserModule,
  ],
  providers: [BlockService, BlockRepository, FriendRepository],
  exports: [BlockService],
  controllers: [BlockController],
})
export class BlockModule {}
