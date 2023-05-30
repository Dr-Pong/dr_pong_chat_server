import { Module } from '@nestjs/common';
import { ChannelUserService } from './channel-user.service';

@Module({
  providers: [ChannelUserService],
})
export class ChannelUserModule {}
