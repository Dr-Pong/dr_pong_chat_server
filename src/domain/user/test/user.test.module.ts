import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { UserTestService } from './user.test.service';
import { ProfileImage } from '../../profile-image/profile-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ProfileImage])],
  providers: [UserTestService],
  exports: [UserTestService],
})
export class UserTestModule {}
