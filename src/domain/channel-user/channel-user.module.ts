import { Module } from '@nestjs/common';
import { ChannelUserService } from './channel-user.service';
import { FactoryModule } from '../factory/factory.module';
import { ChannelRepository } from '../channel/channel.repository';
import { ChannelUserRepository } from './channel-user.repository';
import { ChannelMessageRepository } from '../channel-message/channel-message.repository';
import { GatewayModule } from 'src/gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelMessage } from '../channel-message/channel-message.entity';
import { Channel } from '../channel/channel.entity';
import { ChannelUser } from './channel-user.entity';

@Module({
  imports: [
    FactoryModule,
    GatewayModule,
    TypeOrmModule.forFeature([Channel, ChannelUser, ChannelMessage]),
  ],
  providers: [
    ChannelUserService,
    ChannelRepository,
    ChannelUserRepository,
    ChannelMessageRepository,
  ],
  exports: [ChannelUserService],
})
export class ChannelUserModule {}
