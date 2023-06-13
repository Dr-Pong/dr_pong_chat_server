import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { UserTestService } from './user.test.service';
import { ProfileImage } from '../../profile-image/profile-image.entity';
import { Friend } from 'src/domain/friend/friend.entity';
import { Block } from 'src/domain/block/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ProfileImage, Friend, Block])],
  providers: [UserTestService],
  exports: [UserTestService],
})
export class UserTestModule {}
