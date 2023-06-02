import { Module } from '@nestjs/common';
import { Friend } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendService } from './friend.service';
import { FriendRepository } from './friend.repository';
import { UserFactory } from '../user/user.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Friend, UserFactory])],
  providers: [FriendService, FriendRepository, UserFactory],
  exports: [FriendService],
  controllers: [],
})
export class FriendModule {}
