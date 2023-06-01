import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelUser } from './channel-user.entity';
import { User } from '../user/user.entity';
import { Channel } from '../channel/channel.entity';

@Injectable()
export class ChannelUserRepository {
  constructor(
    @InjectRepository(ChannelUser)
    private readonly userChannelRepository: Repository<ChannelUser>,
  ) {}

  async findByUserIdAndNotDeleted(userId: number): Promise<ChannelUser> {
    return await this.userChannelRepository.findOne({
      where: {
        user: { id: userId },
        isDeleted: false,
      },
    });
  }

  async saveChannelUser(channel: Channel, user: User): Promise<ChannelUser> {
    return await this.userChannelRepository.save({
      channel: channel,
      user: user,
    });
  }
}
