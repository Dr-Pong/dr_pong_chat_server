import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Block } from 'src/domain/block/block.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { BlockTestService } from './block.test.service';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { AuthModule } from 'src/domain/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Block, ProfileImage]),
    FactoryModule,
    AuthModule,
  ],
  providers: [BlockTestService],
  exports: [BlockTestService],
})
export class BlockTestModule {}
