import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessageRoom } from './direct-message-room.entity';

@Injectable()
export class DirectMessageRoomRepository {
  constructor(
    @InjectRepository(DirectMessageRoom)
    private readonly repository: Repository<DirectMessageRoom>,
  ) {}
}
