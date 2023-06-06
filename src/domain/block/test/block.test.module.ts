import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ProfileImageRepository } from 'src/domain/profile-image/profile-image.repository';
import { BlockTestService } from './block.test.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Block,
      ProfileImageRepository,
      ProfileImage,
    ]),
  ],
  providers: [BlockTestService],
  exports: [
    BlockTestService,
    TypeOrmModule.forFeature([
      User,
      Block,
      ProfileImage,
      ProfileImageRepository,
    ]),
  ],
})
export class TestModule {}
