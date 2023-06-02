import { Module } from '@nestjs/common';
import { DirectMessageRoomService } from './direct-message-room.service';
import { DirectMessageRoom } from './direct-message-room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessageRoomRepository } from './direct-message-room.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessageRoom])],
  providers: [DirectMessageRoomService, DirectMessageRoomRepository],
  exports: [DirectMessageRoomService],
  controllers: [],
})
export class DirectMessageRoomModule {}
