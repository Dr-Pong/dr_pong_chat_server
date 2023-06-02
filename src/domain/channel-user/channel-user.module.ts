import { Module } from '@nestjs/common';
import { ChannelUserService } from './channel-user.service';
import { TestModule } from './test/test.module';

@Module({
  imports: [TestModule],
  providers: [ChannelUserService],
})
export class ChannelUserModule {}
