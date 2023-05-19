import { Module } from '@nestjs/common';
import { Friend } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendService } from './friend.service';
import { ProfileImageRepository } from '../profile-image/profile-image.repository';
import { ProfileImage } from '../profile-image/profile-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Friend, ProfileImage])],
  providers: [FriendService, ProfileImageRepository],
  exports: [FriendService],
  controllers: [],
})
export class FrinedModule {}
