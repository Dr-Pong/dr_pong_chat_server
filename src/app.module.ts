import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
<<<<<<< HEAD
import { FrinedModule } from './domain/frined/frined.module';
import { UserModule } from './domain/user/user.module';
import { ProfileImageModule } from './domain/profile-image/profile-image.module';

@Module({
  imports: [FrinedModule, UserModule, ProfileImageModule],
=======
import { FrinedModule } from './frined/frined.module';

@Module({
  imports: [FrinedModule],
>>>>>>> 8593faf581efe551fa7d0a26440d35d59b94c863
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
