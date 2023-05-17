import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FrinedModule } from './domain/frined/frined.module';
import { UserModule } from './domain/user/user.module';
import { ProfileImageModule } from './domain/profile-image/profile-image.module';
import { BlockModule } from './domain/block/block.module';

@Module({
  imports: [FrinedModule, UserModule, ProfileImageModule, BlockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
