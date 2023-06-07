import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './domain/user/user.module';
import { ProfileImageModule } from './domain/profile-image/profile-image.module';
import { BlockModule } from './domain/block/block.module';
import { ChannelModule } from './domain/channel/channel.module';
import { ChannelLogModule } from './domain/channel-log/channel-log.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { ChannelMessageModule } from './domain/channel-message/channel-message.module';
import { DirectMessageRoomModule } from './domain/direct-message-room/direct-message-room.module';
import { DirectMessageModule } from './domain/direct-message/direct-message.module';
import { FriendModule } from './domain/friend/friend.module';
import { AuthModule } from './domain/auth/auth.module';
import { FriendTestModule } from './domain/friend/test/friend.test.module';

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
    ChannelLogModule,
    DirectMessageModule,
    ChannelMessageModule,
    DirectMessageRoomModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
