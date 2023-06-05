import { Module } from '@nestjs/common';
import { Friend } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendService } from './friend.service';
import { FriendRepository } from './friend.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Friend])],
  providers: [FriendService, FriendRepository],
  exports: [FriendService],
  controllers: [],
})
export class FriendModule {}
