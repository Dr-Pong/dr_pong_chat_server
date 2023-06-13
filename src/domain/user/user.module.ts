import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { FriendRepository } from '../friend/friend.repository';
import { BlockRepository } from '../block/block.repository';
import { Friend } from '../friend/friend.entity';
import { Block } from '../block/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friend, Block])],
  providers: [UserService, UserRepository, FriendRepository, BlockRepository],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
