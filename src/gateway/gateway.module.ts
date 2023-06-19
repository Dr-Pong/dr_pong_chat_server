import { Module } from '@nestjs/common';
import { ChatGateWay } from './chat.gateway';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { ChannelChatGateWay } from './channel.chat.gateway';
import { AuthModule } from 'src/domain/auth/auth.module';

@Module({
  imports: [FactoryModule, AuthModule],
  providers: [ChatGateWay, ChannelChatGateWay],
  exports: [ChatGateWay, ChannelChatGateWay],
})
export class GatewayModule {}
