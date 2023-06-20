import { Module } from '@nestjs/common';
import { NotificationGateWay } from './notification.gateway';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { ChannelGateWay } from './channel.gateway';
import { AuthModule } from 'src/domain/auth/auth.module';
import { FriendGateWay } from './friend.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from 'src/domain/friend/friend.entity';
import { FriendRepository } from 'src/domain/friend/friend.repository';

@Module({
  imports: [FactoryModule, AuthModule, TypeOrmModule.forFeature([Friend])],
  providers: [
    FriendRepository,
    NotificationGateWay,
    ChannelGateWay,
    FriendGateWay,
  ],
  exports: [NotificationGateWay, ChannelGateWay, FriendGateWay],
})
export class GatewayModule {}
