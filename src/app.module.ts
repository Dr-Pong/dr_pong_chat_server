import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FrinedModule } from './frined/frined.module';

@Module({
  imports: [FrinedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
