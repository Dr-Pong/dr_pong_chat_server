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
import { GatewayModule } from 'src/gateway/gateway.module';
import { DirectMessageRoomRepository } from '../direct-message-room/direct-message-room.repository';
import { DirectMessageRoom } from '../direct-message-room/direct-message-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, Block, DirectMessageRoom]),
    UserModule,
    DirectMessageModule,
    DirectMessageRoomModule,
    GatewayModule,
  ],
  providers: [
    FriendService,
    FriendRepository,
    BlockRepository,
    DirectMessageRoomRepository,
  ],
  exports: [FriendService],
  controllers: [FriendRelationController, FriendChatController],
})
export class FriendModule {}
