import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './direct-message.entity';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageRepository } from './direct-message.repository';
import { FriendRepository } from '../friend/friend.repository';
import { Friend } from '../friend/friend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessage, Friend])],
  providers: [DirectMessageService, DirectMessageRepository, FriendRepository],
  exports: [DirectMessageService],
  controllers: [],
})
export class DirectMessageModule {}
