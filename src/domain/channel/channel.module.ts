import { Module } from '@nestjs/common';
import { ChannelAdminService } from './service/channel.admin.service';
import { FactoryModule } from '../factory/factory.module';
import { GatewayModule } from 'src/gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelUser } from './entity/channel-user.entity';
import { ChannelMessage } from './entity/channel-message.entity';
import { ChannelRepository } from './repository/channel.repository';
import { ChannelUserRepository } from './repository/channel-user.repository';
import { ChannelMessageRepository } from './repository/channel-message.repository';
import { ChannelNormalService } from './service/channel.normal.service';
import { Channel } from './entity/channel.entity';
import { ChannelNormalController } from './channel.normal.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    FactoryModule,
    GatewayModule,
    UserModule,
    TypeOrmModule.forFeature([Channel, ChannelUser, ChannelMessage]),
  ],
  providers: [
    ChannelNormalService,
    ChannelAdminService,
    ChannelRepository,
    ChannelUserRepository,
    ChannelMessageRepository,
  ],
  controllers: [ChannelNormalController],
  exports: [ChannelAdminService, ChannelNormalService],
})
export class ChannelModule {}
