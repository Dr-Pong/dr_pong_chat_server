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

  async findByUserIdAndNotDeleted(userId: number): Promise<ChannelUser> {
    return await this.userChannelRepository.findOne({
      where: {
        user: { id: userId },
        isDeleted: false,
      },
    });
  }

  async saveChannelUser(saveDto: SaveChannelUserDto): Promise<ChannelUser> {
    return await this.userChannelRepository.save({
      channel: {saveDto.channelId},
      user: {saveDto.userId},
    });
  }
}
