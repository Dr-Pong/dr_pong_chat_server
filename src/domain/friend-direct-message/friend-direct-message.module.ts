import { Module } from '@nestjs/common';
import { FriendDirectMessageService } from './friend-direct-message.service';
import { FriendDirectMessage } from './friend-direct-message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendDirectMessageRepository } from './friend-direct-message.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FriendDirectMessage])],
  providers: [FriendDirectMessageService, FriendDirectMessageRepository],
  exports: [FriendDirectMessageService],
  controllers: [],
})
export class FriendDirectMessageModule {}
