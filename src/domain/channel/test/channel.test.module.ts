import { Module } from '@nestjs/common';
import { ChannelTestService } from './channel.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { ChannelUser } from '../entity/channel-user.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ChannelMessage } from 'src/domain/channel/entity/channel-message.entity';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { Channel } from 'src/domain/channel/entity/channel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channel,
      User,
      ChannelUser,
      ProfileImage,
      ChannelMessage,
    ]),
    FactoryModule,
  ],
  providers: [ChannelTestService],
})
export class ChannlTestModule {}
