import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelUser } from '../entity/channel-user.entity';
import { SaveChannelUserDto } from '../dto/post/save.channel-user.dto';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_NORMAL,
} from '../type/type.channel-participant';

@Injectable()
export class ChannelUserRepository {
  constructor(
    @InjectRepository(ChannelUser)
    private readonly repository: Repository<ChannelUser>,
  ) {}

  async findAll(): Promise<ChannelUser[]> {
    return await this.repository.find({ where: { isDeleted: false } });
  }

  async findAllPaneltyUsers(): Promise<ChannelUser[]> {
    return await this.repository.find({
      where: [
        { channel: { isDeleted: false }, isMuted: true },
        { channel: { isDeleted: false }, isBanned: true },
      ],
    });
  }

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

  async save(saveDto: SaveChannelUserDto): Promise<ChannelUser> {
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

  async updateIsMutedTrue(userId: number, channelId: string): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, channel: { id: channelId }, isDeleted: false },
      { isMuted: true },
    );
  }

  async updateIsMutedFalse(userId: number, channelId: string): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, channel: { id: channelId }, isDeleted: false },
      { isMuted: false },
    );
  }

  async updateIsBannedTure(userId: number, channelId: string): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, channel: { id: channelId }, isDeleted: false },
      { isBanned: true },
    );
  }

  async updateRoleTypeAdmin(userId: number, channelId: string): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, channel: { id: channelId }, isDeleted: false },
      { roleType: CHANNEL_PARTICIPANT_ADMIN },
    );
  }

  async updateRoleTypeNormal(userId: number, channelId: string): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, channel: { id: channelId }, isDeleted: false },
      { roleType: CHANNEL_PARTICIPANT_NORMAL },
    );
  }
}
