import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChannelModel } from '../factory/model/channel.model';
import { Channel } from '../channel/channel.entity';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
} from 'src/global/type/type.channel';
import { ChannelRepository } from '../channel/channel.repository';
import { ChannelJoinDto } from './dto/channel.join.dto';
import { UserModel } from '../factory/model/user.model';
import { User } from '../user/user.entity';
import { ChannelAdminCommandDto } from './dto/channel.admin.command.dto';
import { ChannelFactory } from '../factory/channel.factory';
import { UserFactory } from '../factory/user.factory';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_OWNER,
} from 'src/global/type/type.channel-participant';

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

export function checkUserIsBanned(channel: ChannelModel, userId: number): void {
  if (channel.banList.has(userId)) {
    throw new BadRequestException('You are banned');
  }
}

export async function validateChannelJoin(
  dto: ChannelJoinDto,
  channelRepository: ChannelRepository,
  channelFactory: ChannelFactory,
): Promise<void> {
  const channel: Channel = await channelRepository.findById(dto.channelId);
  checkChannelExist(channel);
  checkChannelIsFull(channel);
  checkUserIsBanned(channelFactory.findById(channel.id), dto.userId);

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

function checkIfAccessToOwner(
  targetUser: UserModel,
  channel: ChannelModel,
): void {
  if (targetUser.id === channel.ownerId) {
    throw new BadRequestException('You cannot access to owner');
  }
}

export function checkUserHaveAuthority(requestUser: UserModel): void {
  if (
    requestUser.roleType !== CHANNEL_PARTICIPANT_ADMIN &&
    requestUser.roleType !== CHANNEL_PARTICIPANT_OWNER
  ) {
    throw new BadRequestException('You are not admin');
  }
}

function checkAccessToSameRoleType(
  requestUser: UserModel,
  targetUser: UserModel,
): void {
  if (requestUser.roleType === targetUser.roleType) {
    throw new BadRequestException('You cannot access to same role');
  }
}

export function checkExcutable(
  dto: ChannelAdminCommandDto,
  channelFactory: ChannelFactory,
  userFactory: UserFactory,
): void {
  const requestUser: UserModel = userFactory.findById(dto.requestUserId);
  const targetUser: UserModel = userFactory.findById(dto.targetUserId);
  const channel: ChannelModel = channelFactory.findById(dto.channelId);

  checkUserInChannel(channel, requestUser.id);
  checkUserHaveAuthority(requestUser);
  checkIfAccessToOwner(targetUser, channel);
  checkAccessToSameRoleType(requestUser, targetUser);
}

export function checkUserIsOwner(channel: ChannelModel, userId: number): void {
  if (userId !== channel.ownerId) {
    throw new BadRequestException('You are not owner');
  }
}

export function isUserAdmin(channel: ChannelModel, userId: number): boolean {
  return channel.adminList.has(userId);
}

export async function checkChannelNameIsDuplicate(
  repository: ChannelRepository,
  name: string,
): Promise<void> {
  const channel = await repository.findByChannelName(name);
  if (channel) {
    throw new BadRequestException('Channel name already exists');
  }
}
