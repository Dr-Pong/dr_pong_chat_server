import { Module } from '@nestjs/common';
import { FriendTestService } from './friend.test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Friend } from '../friend.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImageRepository,
      ProfileImage,
    ]),
    AuthModule,
  ],
  providers: [FriendTestService],
  exports: [
    FriendTestService,
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImage,
      ProfileImageRepository,
    ]),
  ],
})
export class TestModule {}
