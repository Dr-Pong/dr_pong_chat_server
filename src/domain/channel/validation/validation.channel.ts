import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChannelModel } from '../../factory/model/channel.model';
import { Channel } from '../entity/channel.entity';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
} from 'src/domain/channel/type/type.channel';
import { ChannelRepository } from '../repository/channel.repository';
import { UserModel } from '../../factory/model/user.model';
import { ChannelFactory } from '../../factory/channel.factory';
import { UserFactory } from '../../factory/user.factory';
import { ChannelJoinDto } from '../dto/channel.join.dto';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_OWNER,
} from '../type/type.channel-participant';
import { ChannelAdminCommandDto } from '../dto/channel.admin.command.dto';
import * as bcrypt from 'bcrypt';

export function checkUserInChannel(
  channel: ChannelModel,
  userId: number,
): void {
  if (!channel.users.has(userId))
    throw new BadRequestException('You are not in this channel');
}

export function checkChannelExist(channel: Channel | ChannelModel): void {
  if (!channel) {
    throw new NotFoundException('no bang');
  }
}

export function checkChannelIsPrivate(channel: Channel): void {
  if (channel.type === CHANNEL_PRIVATE) {
    throw new BadRequestException('private');
  }
}

export function checkChannelIsFull(channel: Channel): void {
  if (channel.headCount >= channel.maxHeadCount) {
    throw new BadRequestException('full bang');
  }
}

export async function checkChannelPassword(
  channel: Channel,
  password: string,
): Promise<void> {
  if (
    channel.type === CHANNEL_PROTECTED &&
    !(await bcrypt.compare(password, channel.password))
  ) {
    throw new BadRequestException('wrong password');
  }
}

export function checkUserIsBanned(channel: ChannelModel, userId: number): void {
  if (channel.banList.has(userId)) {
    throw new BadRequestException('ban');
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
    await checkChannelPassword(channel, dto.password);
  }
}

export function checkUserIsInvited(user: UserModel, channelId: string): void {
  if (!user.channelInviteList.has(channelId)) {
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
    throw new BadRequestException('title taken');
  }
}
