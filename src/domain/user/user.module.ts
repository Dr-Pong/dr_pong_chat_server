import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { FriendRepository } from '../friend/friend.repository';
import { BlockRepository } from '../block/block.repository';
import { Friend } from '../friend/friend.entity';
import { Block } from '../block/block.entity';
import { FactoryModule } from '../factory/factory.module';
import { ProfileImageRepository } from '../profile-image/profile-image.repository';
import { ProfileImage } from '../profile-image/profile-image.entity';
import { UserController } from './controller/user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friend, Block, ProfileImage]),
    FactoryModule,
  ],
  providers: [
    UserService,
    UserRepository,
    FriendRepository,
    BlockRepository,
    ProfileImageRepository,
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
