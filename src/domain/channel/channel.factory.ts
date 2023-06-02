import { Injectable } from '@nestjs/common';
import { ChannelModel } from './channel.model';
import { UserModel } from '../user/user.model';
import { ChannelType } from 'src/global/type/type.channel';
import { UserFactory } from '../user/user.factory';

@Injectable()
export class ChannelFactory {
  constructor(private readonly userFactory: UserFactory) {}
  channels: Map<string, ChannelModel> = new Map();

  findById(id: string): ChannelModel {
    return this.channels.get(id);
  }

  findByChannelName(name: string): ChannelModel {
    this.channels.forEach((channel) => {
      if (channel.name === name) {
        return channel;
      }
    });
    return null;
  }

  getUsers(channelId: string): UserModel[] {
    const users: UserModel[] = [];
    this.findById(channelId).users.forEach((user) => {
      users.push(this.userFactory.users.get(user));
    });
    return users;
  }

  create(userId: number, channel: ChannelModel): boolean {
    if (!this.findByChannelName(channel.name)) {
      channel.ownerId = userId;
      this.channels.set(channel.id, channel);
      this.join(userId, channel.id);
      this.userFactory.joinChannel(userId, channel);
      this.userFactory.setOwner(userId);
      return true;
    }
    return false;
  }

  join(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (
      channel.maxHeadCount !== channel.users.size &&
      !channel.users.has(userId)
    ) {
      channel.users.set(userId, userId);
      this.userFactory.joinChannel(userId, channel);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  leave(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.users.delete(userId);
      this.userFactory.leaveChannel(userId);
      this.channels.set(channel.id, channel);
      if (channel.users.size === 0) {
        this.channels.delete(channel.id);
      }
      return true;
    }
    return false;
  }

  setMute(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.muteList.set(userId, userId);
      this.channels.set(channel.id, channel);
      this.userFactory.mute(userId);
      return true;
    }
    return false;
  }

  unsetMute(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.muteList.delete(userId);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  setBan(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.banList.set(userId, userId);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  unsetBan(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.banList.delete(userId);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  updateType(type: ChannelType, channelId: string): void {
    const channel: ChannelModel = this.findById(channelId);
    channel.type = type;
    this.channels.set(channel.id, channel);
  }

  updatePassword(password: string, channelId: string): void {
    const channel: ChannelModel = this.findById(channelId);
    channel.password = password;
    this.channels.set(channelId, channel);
  }

  setAdmin(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.adminList.set(userId, userId);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  unsetAdmin(userId: number, channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    if (channel.users.has(userId)) {
      channel.adminList.set(userId, userId);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  delete(channelId: string): boolean {
    const channel: ChannelModel = this.findById(channelId);
    channel.users.forEach((user) => this.userFactory.leaveChannel(user));
    return this.channels.delete(channelId);
  }
}
