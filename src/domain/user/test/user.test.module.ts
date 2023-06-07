import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { UserTestService } from './user.test.service';
import { ProfileImageRepository } from '../../profile-image/profile-image.repository';
import {ProfileImage} from "../../profile-image/profile-image.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, ProfileImage, ProfileImageRepository])],
  providers: [UserTestService],
  exports: [UserTestService],
})
export class UserTestModule {}
