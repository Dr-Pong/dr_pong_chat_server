import { Module } from '@nestjs/common';
import { Friend } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendService } from './friend.service';

@Module({
  imports: [TypeOrmModule.forFeature([Friend])],
  providers: [FriendService],
  exports: [FriendService],
  controllers: [],
})
export class FrinedModule {}
