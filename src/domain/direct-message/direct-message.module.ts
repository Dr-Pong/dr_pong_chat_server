import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './direct-message.entity';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageRepository } from './direct-message.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessage])],
  providers: [DirectMessageService, DirectMessageRepository],
  exports: [DirectMessageService],
  controllers: [],
})
export class DirectMessageModule {}
