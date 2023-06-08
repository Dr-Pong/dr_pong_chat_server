import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelUser } from './channel-user.entity';
import { SaveChannelUserDto } from './dto/save.channel-user.dto';

@Injectable()
export class ChannelUserRepository {
  constructor(
    @InjectRepository(ChannelUser)
    private readonly repository: Repository<ChannelUser>,
  ) {}

  async findByUserIdAndNotDeleted(userId: number): Promise<ChannelUser> {
    return await this.repository.findOne({
      where: {
        user: { id: userId },
        isDeleted: false,
      },
    });
  }

  async findByUserIdAndChannelId(
    userId: number,
    channelId: string,
  ): Promise<ChannelUser> {
    return await this.repository.findOne({
      where: {
        user: { id: userId },
        channel: { id: channelId },
      },
    });
  }

  async findByUserIdAndChannelIdAndIsDelFalse(
    userId: number,
    channelId: string,
  ): Promise<ChannelUser> {
    return await this.repository.findOne({
      where: {
        user: { id: userId },
        channel: { id: channelId },
        isDeleted: false,
      },
    });
  }

  async saveChannelUser(saveDto: SaveChannelUserDto): Promise<ChannelUser> {
    return await this.repository.save({
      user: { id: saveDto.userId },
      channel: { id: saveDto.channelId },
    });
  }

  async deleteByUserIdAndChannelId(
    userId: number,
    channelId: string,
  ): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, channel: { id: channelId }, isDeleted: false },
      { isDeleted: true },
    );
  }

  async deleteByChannelId(channelId: string): Promise<void> {
    await this.repository.update(
      { channel: { id: channelId }, isDeleted: false },
      { isDeleted: true },
    );
  }
}
