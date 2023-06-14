import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { ChannelModule } from '../channel/channel.module';
import { FriendModule } from '../friend/friend.module';

@Module({
  imports: [FriendModule, ChannelModule],
  providers: [],
  exports: [],
  controllers: [NotificationController],
})
export class NotificationModule {}
