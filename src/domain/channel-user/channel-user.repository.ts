import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelUser } from './channel-user.entity';

@Injectable()
export class ChannelUserRepository {
  constructor(
    @InjectRepository(ChannelUser)
    private readonly userChannelRepository: Repository<ChannelUser>,
  ) {}
}
