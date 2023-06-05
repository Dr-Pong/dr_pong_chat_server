import { Module } from '@nestjs/common';
import { DirectMessageRoomService } from './direct-message-room.service';
import { DirectMessageRoom } from './direct-message-room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessageRoomRepository } from './direct-message-room.repository';
import { DirectMessage } from '../direct-message/direct-message.entity';
import { DirectMessageRepository } from '../direct-message/direct-message.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessageRoom, DirectMessage])],
  providers: [
    DirectMessageRoomService,
    DirectMessageRoomRepository,
    DirectMessageRepository,
  ],
  exports: [DirectMessageRoomService],
  controllers: [],
})
export class DirectMessageRoomModule {}
