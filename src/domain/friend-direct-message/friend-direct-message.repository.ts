import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendDirectMessage } from './friend-direct-message.entity';

@Injectable()
export class FriendDirectMessageRepository {
  constructor(
    @InjectRepository(FriendDirectMessage)
    private readonly repository: Repository<FriendDirectMessage>,
  ) {}
}
