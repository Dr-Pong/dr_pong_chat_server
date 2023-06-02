import { Module } from '@nestjs/common';
import { ChannelFactory } from './channel.factory';
import { UserFactory } from './user.factory';

@Module({
  providers: [ChannelFactory, UserFactory],
  exports: [ChannelFactory, UserFactory],
})
export class FactoryModule {}
