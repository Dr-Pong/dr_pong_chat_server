import { Injectable } from '@nestjs/common';
import { DirectMessage } from './direct-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DirectMessageRepository {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly repository: Repository<DirectMessage>,
  ) {}
}
