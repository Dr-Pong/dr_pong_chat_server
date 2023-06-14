import { Module } from '@nestjs/common';
import { Friend } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendService } from './friend.service';
import { FriendRepository } from './friend.repository';
import { FriendRelationController } from './controller/friend.relation.controller';
import { FriendChatController } from './controller/friend.chat.controller';
import { UserModule } from '../user/user.module';
import { DirectMessageModule } from '../direct-message/direct-message.module';
import { DirectMessageRoomModule } from '../direct-message-room/direct-message-room.module';
import { BlockRepository } from '../block/block.repository';
import { Block } from '../block/block.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, Block]),
    UserModule,
    DirectMessageModule,
    DirectMessageRoomModule,
  ],
  providers: [FriendService, FriendRepository, BlockRepository],
  exports: [FriendService],
  controllers: [FriendRelationController, FriendChatController],
})
export class FriendModule {}
