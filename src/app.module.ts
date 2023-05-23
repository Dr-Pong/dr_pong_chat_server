import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FrinedModule } from './domain/frined/frined.module';
import { UserModule } from './domain/user/user.module';
import { ProfileImageModule } from './domain/profile-image/profile-image.module';
import { BlockModule } from './domain/block/block.module';
import { DmLogModule } from './domain/dm-log/dm-log.module';
import { ChannelModule } from './domain/channel/channel.module';
import { ChannelLogModule } from './domain/channel-log/channel-log.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

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
    FrinedModule,
    UserModule,
    ProfileImageModule,
    BlockModule,
    ChannelModule,
    ChannelLogModule,
    DmLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
