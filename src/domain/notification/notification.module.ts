import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Friend } from '../friend/friend.entity';
import { Block } from '../block/block.entity';
import { FactoryModule } from '../factory/factory.module';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { FriendRepository } from '../friend/friend.repository';
import { BlockRepository } from '../block/block.repository';
import { UserController } from '../user/user.controller';
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
