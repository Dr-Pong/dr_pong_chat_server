import { Module } from '@nestjs/common';
import { DirectMessageRoomTestService } from './direct-message-room.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { Friend } from 'src/domain/friend/friend.entity';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';
import { DirectMessageRoom } from '../direct-message-room.entity';
import { AuthModule } from '../../auth/auth.module';

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
  providers: [DirectMessageRoomTestService],
  exports: [DirectMessageRoomTestService],
})
export class DirectMessageRoomTestModule {}
