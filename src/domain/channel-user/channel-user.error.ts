import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChannelModel } from '../channel/channel.model';
import { Channel } from '../channel/channel.entity';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
} from 'src/global/type/type.channel';
import { ChannelRepository } from '../channel/channel.repository';
import { ChannelJoinDto } from './dto/channel.join.dto';
import { ChannelUserRepository } from './channel-user.repository';
import { ChannelUser } from './channel-user.entity';
import { PENALTY_BANNED } from 'src/global/type/type.channel-user';
import { UserModel } from '../user/user.model';
import { User } from '../user/user.entity';

export function checkUserInChannel(
  channel: ChannelModel,
  userId: number,
): void {
  if (!channel.users.has(userId))
    throw new BadRequestException('You are not in this channel');
}

export function checkUserExist(user: User | UserModel): void {
  if (!user) {
    throw new NotFoundException('User does not exist');
  }
}

export function checkChannelExist(channel: Channel | ChannelModel): void {
  if (!channel) {
    throw new NotFoundException('Channel does not exist');
  }
}

export function checkChannelIsPrivate(channel: Channel): void {
  if (channel.type === CHANNEL_PRIVATE) {
    throw new BadRequestException('Channel is private');
  }
}

export function checkChannelIsFull(channel: Channel): void {
  if (channel.headCount >= channel.maxHeadCount) {
    throw new BadRequestException('Channel is full');
  }
}

export function checkChannelPassword(channel: Channel, password: string): void {
  if (channel.type === CHANNEL_PROTECTED && channel.password !== password) {
    throw new BadRequestException('Password is wrong');
  }
}

export function checkUserIsBanned(channelUser: ChannelUser): void {
  if (channelUser.penalty === PENALTY_BANNED)
    throw new BadRequestException('You are banned');
}

export async function validateChannelJoin(
  dto: ChannelJoinDto,
  channelRepository: ChannelRepository,
  channelUserRepository: ChannelUserRepository,
): Promise<void> {
  const channel: Channel = await channelRepository.findById(dto.channelId);
  const channelUser: ChannelUser =
    await channelUserRepository.findByUserIdAndChannelId(
      dto.userId,
      dto.channelId,
    );
  checkChannelExist(channel);
  checkChannelIsFull(channel);
  checkUserIsBanned(channelUser);

  if (dto.joinType === 'join') {
    checkChannelIsPrivate(channel);
    checkChannelPassword(channel, dto.password);
  }
}

export function checkUserIsInvited(user: UserModel, channelId: string): void {
  checkUserExist(user);
  if (!user.inviteList.has(channelId)) {
    throw new BadRequestException('You are not invited');
  }
}
