import { Module } from '@nestjs/common';
import { NotificationGateWay } from './notification.gateway';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { ChannelGateWay } from './channel.gateway';
import { AuthModule } from 'src/domain/auth/auth.module';
import { FriendGateWay } from './friend.gateway';

@Module({
  imports: [FactoryModule, AuthModule],
  providers: [NotificationGateWay, ChannelGateWay, FriendGateWay],
  exports: [NotificationGateWay, ChannelGateWay, FriendGateWay],
})
export class GatewayModule {}
