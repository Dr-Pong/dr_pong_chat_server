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
import { FriendTestModule } from './domain/friend/test/friend.test.module';
import { FactoryModule } from './domain/factory/factory.module';
import { ChannelRepository } from './domain/channel/repository/channel.repository';
import { UserRepository } from './domain/user/user.repository';
import { ChannelUserRepository } from './domain/channel/repository/channel-user.repository';
import { Channel } from './domain/channel/entity/channel.entity';
import { User } from './domain/user/user.entity';
import { ChannelUser } from './domain/channel/entity/channel-user.entity';
import { BlockRepository } from './domain/block/block.repository';
import { Block } from './domain/block/block.entity';

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
    FriendTestModule,
    UserModule,
    ProfileImageModule,
    BlockModule,
    ChannelModule,
    DirectMessageModule,
    DirectMessageRoomModule,
    AuthModule,
    FactoryModule,
    TypeOrmModule.forFeature([Channel, User, ChannelUser, Block]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ChannelRepository,
    UserRepository,
    ChannelUserRepository,
    BlockRepository,
  ],
})
export class AppModule {}
