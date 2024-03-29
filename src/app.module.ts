import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './domain/user/user.module';
import { ProfileImageModule } from './domain/profile-image/profile-image.module';
import { BlockModule } from './domain/block/block.module';
import { ChannelModule } from './domain/channel/channel.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { DirectMessageRoomModule } from './domain/direct-message-room/direct-message-room.module';
import { DirectMessageModule } from './domain/direct-message/direct-message.module';
import { FriendModule } from './domain/friend/friend.module';
import { AuthModule } from './domain/auth/auth.module';
import { FactoryModule } from './domain/factory/factory.module';
import { ChannelRepository } from './domain/channel/repository/channel.repository';
import { UserRepository } from './domain/user/user.repository';
import { ChannelUserRepository } from './domain/channel/repository/channel-user.repository';
import { Channel } from './domain/channel/entity/channel.entity';
import { User } from './domain/user/user.entity';
import { ChannelUser } from './domain/channel/entity/channel-user.entity';
import { BlockRepository } from './domain/block/block.repository';
import { Block } from './domain/block/block.entity';
import { GatewayModule } from './gateway/gateway.module';
import { ProfileImageRepository } from './domain/profile-image/profile-image.repository';
import { ProfileImage } from './domain/profile-image/profile-image.entity';
import { InvitationModule } from './domain/invitation/invitation.module';
import { NotificationModule } from './domain/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory() {
        return typeORMConfig;
      },
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource({
          dataSource: new DataSource(options),
        });
      },
    }),
    FriendModule,
    UserModule,
    ProfileImageModule,
    BlockModule,
    ChannelModule,
    DirectMessageModule,
    DirectMessageRoomModule,
    AuthModule,
    FactoryModule,
    GatewayModule,
    NotificationModule,
    InvitationModule,
    TypeOrmModule.forFeature([Channel, User, ChannelUser, Block, ProfileImage]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ChannelRepository,
    UserRepository,
    ChannelUserRepository,
    BlockRepository,
    ProfileImageRepository,
  ],
})
export class AppModule {}
