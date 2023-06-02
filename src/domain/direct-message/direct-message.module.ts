import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './direct-message.entity';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageRepository } from './direct-message.repository';
import { FriendRepository } from '../friend/friend.repository';
import { Friend } from '../friend/friend.entity';
import { DirectMessageRoom } from '../direct-message-room/direct-message-room.entity';
import { DirectMessageRoomRepository } from '../direct-message-room/direct-message-room.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessage, Friend, DirectMessageRoom]),
  ],
  providers: [
    DirectMessageService,
    DirectMessageRepository,
    FriendRepository,
    DirectMessageRoomRepository,
  ],
  exports: [DirectMessageService],
  controllers: [],
})
export class DirectMessageModule {}
