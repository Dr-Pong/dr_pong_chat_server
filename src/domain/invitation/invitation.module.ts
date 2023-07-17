import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { FactoryModule } from '../factory/factory.module';
import { GatewayModule } from 'src/gateway/gateway.module';
import { ChannelRepository } from '../channel/repository/channel.repository';
import { ChannelMessageRepository } from '../channel/repository/channel-message.repository';
import { ChannelUserRepository } from '../channel/repository/channel-user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../channel/entity/channel.entity';
import { ChannelMessage } from '../channel/entity/channel-message.entity';
import { ChannelUser } from '../channel/entity/channel-user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    FactoryModule,
    GatewayModule,
    TypeOrmModule.forFeature([Channel, ChannelMessage, ChannelUser]),
  ],
  providers: [
    InvitationService,
    ChannelRepository,
    ChannelMessageRepository,
    ChannelUserRepository,
  ],
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
