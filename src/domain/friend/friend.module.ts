import { Module } from '@nestjs/common';
import { Friend } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendService } from './friend.service';
import { FriendRepository } from './friend.repository';
import { FriendRelationController } from './controller/friend.relation.controller';
import { FriendChatController } from './controller/friend.chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Friend])],
  providers: [FriendService, FriendRepository],
  exports: [FriendService],
  controllers: [FriendRelationController, FriendChatController],
})
export class FriendModule {}
