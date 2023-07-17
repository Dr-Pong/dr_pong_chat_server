import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { ChannelModule } from '../channel/channel.module';
import { FriendModule } from '../friend/friend.module';
import { InvitationModule } from '../invitation/invitation.module';

@Module({
  imports: [FriendModule, ChannelModule, InvitationModule],
  providers: [],
  exports: [],
  controllers: [NotificationController],
})
export class NotificationModule {}
