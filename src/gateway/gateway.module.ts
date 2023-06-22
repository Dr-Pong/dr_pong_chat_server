import { Module } from '@nestjs/common';
import { NotificationGateWay } from './notification.gateway';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { ChannelGateWay } from './channel.gateway';
import { AuthModule } from 'src/domain/auth/auth.module';
import { FriendGateWay } from './friend.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from 'src/domain/friend/friend.entity';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import { DirectMessageRepository } from 'src/domain/direct-message/direct-message.repository';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';
import { DirectMessageRoomRepository } from 'src/domain/direct-message-room/direct-message-room.repository';
import { DirectMessageGateway } from './direct-message.gateway';

@Module({
  imports: [
    FactoryModule,
    AuthModule,
    TypeOrmModule.forFeature([Friend, DirectMessage, DirectMessageRoom]),
  ],
  providers: [
    FriendRepository,
    DirectMessageRepository,
    DirectMessageRoomRepository,
    NotificationGateWay,
    ChannelGateWay,
    FriendGateWay,
    DirectMessageGateway,
  ],
  exports: [
    NotificationGateWay,
    ChannelGateWay,
    FriendGateWay,
    DirectMessageGateway,
  ],
})
export class GatewayModule {}
