import { Module } from '@nestjs/common';
import { FriendTestService } from './friend.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Friend } from '../friend.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { AuthModule } from '../../auth/auth.module';
import { DirectMessageRoomTestService } from '../../direct-message-room/test/direct-message-room.test.service';
import { DirectMessage } from '../../direct-message/direct-message.entity';
import { DirectMessageRoom } from '../../direct-message-room/direct-message-room.entity';
import { DirectMessageTestService } from '../../direct-message/test/direct-message.test.service';

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
    AuthModule,
  ],
  providers: [
    FriendTestService,
    DirectMessageTestService,
    DirectMessageRoomTestService,
  ],
  exports: [
    FriendTestService,
    DirectMessageTestService,
    DirectMessageRoomTestService,
  ],
})
export class FriendTestModule {}
