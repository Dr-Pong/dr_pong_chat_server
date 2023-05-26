import { Module } from '@nestjs/common';
import { FriendDirectMessageTestService } from './friend-direct-message.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { Friend } from 'src/domain/frined/friend.entity';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';
import { FriendDirectMessage } from '../friend-direct-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImageRepository,
      ProfileImage,
      DirectMessage,
      FriendDirectMessage,
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
      FriendDirectMessage,
    ]),
  ],
})
export class TestModule {}
