import { Module } from '@nestjs/common';
import { DirectMessageTestService } from './direct-message.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { DirectMessage } from '../direct-message.entity';
import { Friend } from 'src/domain/friend/friend.entity';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';

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
  providers: [DirectMessageTestService],
  exports: [
    DirectMessageTestService,
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImage,
      ProfileImageRepository,
      DirectMessage,
    ]),
  ],
})
export class TestModule {}
