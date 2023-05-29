import { Module } from '@nestjs/common';
import { FriendDirectMessageTestService } from './direct-message-room.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { Friend } from 'src/domain/friend/friend.entity';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';
import { DirectMessageRoom } from '../direct-message-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImageRepository,
      ProfileImage,
      DirectMessage,
      DirectMessageRoom,
    ]),
  ],
  providers: [FriendDirectMessageTestService],
  exports: [
    FriendDirectMessageTestService,
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImage,
      ProfileImageRepository,
      DirectMessage,
      DirectMessageRoom,
    ]),
  ],
})
export class TestModule {}
