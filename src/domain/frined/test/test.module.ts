import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Friend } from '../friend.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Friend,
      Block,
      ProfileImageRepository,
      ProfileImage,
    ]),
  ],
  providers: [TestService],
  exports: [
    TestService,
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
