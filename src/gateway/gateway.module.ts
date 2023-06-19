import { Module } from '@nestjs/common';
import { NotificationGateWay } from './notification.gateway';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { ChannelGateWay } from './channel.gateway';
import { AuthModule } from 'src/domain/auth/auth.module';

@Module({
  imports: [FactoryModule, AuthModule],
  providers: [NotificationGateWay, ChannelGateWay],
  exports: [NotificationGateWay, ChannelGateWay],
})
export class GatewayModule {}
