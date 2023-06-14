import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/domain/auth/auth.module';
import { Block } from 'src/domain/block/block.entity';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { BlockTestData } from './block.test.data';
import { Friend } from 'src/domain/friend/friend.entity';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';
import { Channel } from 'src/domain/channel/entity/channel.entity';
import { ChannelUser } from 'src/domain/channel/entity/channel-user.entity';
import { ChannelMessage } from 'src/domain/channel/entity/channel-message.entity';
import { ChannelTestData } from './channel.test.data';
import { DirectMessageTestData } from './direct-message.test.data';
import { DirectMessageRoomTestData } from './direct-message-room.test.data';
import { FriendTestData } from './friend.test.data';
import { UserTestData } from './user.test.data';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Block,
      ProfileImage,
      Friend,
      DirectMessage,
      DirectMessageRoom,
      Channel,
      ChannelUser,
      ChannelMessage,
    ]),
    FactoryModule,
    AuthModule,
  ],
  providers: [
    BlockTestData,
    ChannelTestData,
    DirectMessageTestData,
    DirectMessageRoomTestData,
    FriendTestData,
    UserTestData,
  ],
  exports: [
    BlockTestData,
    ChannelTestData,
    DirectMessageTestData,
    DirectMessageRoomTestData,
    FriendTestData,
    UserTestData,
  ],
})
export class TestDataModule {}
