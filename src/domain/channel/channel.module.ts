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
import { UserRepository } from '../user/user.repository';
import { User } from '../user/user.entity';
import { ChannelAdminController } from './controller/channel.admin.controller';

@Module({
  imports: [
    FactoryModule,
    GatewayModule,
    UserModule,
    TypeOrmModule.forFeature([User, Channel, ChannelUser, ChannelMessage]),
  ],
  providers: [
    ChannelNormalService,
    ChannelAdminService,
    ChannelRepository,
    ChannelUserRepository,
    ChannelMessageRepository,
    UserRepository,
  ],
  controllers: [ChannelNormalController, ChannelAdminController],
  exports: [ChannelAdminService, ChannelNormalService],
})
export class ChannelModule {}
