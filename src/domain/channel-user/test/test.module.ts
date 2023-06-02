import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { ChannelUser } from '../channel-user.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ChannelMessage } from 'src/domain/channel-message/channel-message.entity';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { Channel } from 'src/domain/channel/channel.entity';

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
  providers: [TestService],
})
export class TestModule {}
