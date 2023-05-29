import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './channel.entity';
import { Like, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChannelRepository {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async findChannelByPagesOrderByCreateAt(
    page: number,
    limit: number,
    keyword: string,
  ) {
    return await this.channelRepository.find({
      where: {
        name: Like('%' + keyword + '%'),
        isDeleted: false,
      },
      skip: page * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findChannelByPagesOrderByPopular(
    page: number,
    limit: number,
    keyword: string,
  ) {
    return await this.channelRepository.find({
      where: {
        name: Like('%' + keyword + '%'),
        isDeleted: false,
      },
      skip: page * limit,
      take: limit,
      order: {
        headCount: 'DESC',
      },
    });
  }

  async saveChannel(channel: Channel): Promise<Channel> {
    return await this.channelRepository.save(channel);
  }

  async deleteChannel(channel: Channel): Promise<void> {
    channel.isDeleted = true;
    await this.channelRepository.save(channel);
  }
}
