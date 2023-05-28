import { Injectable } from '@nestjs/common';
import { ChannelModel } from './channel.model';
import { UserModel } from '../user/user.model';
import { ChannelType } from 'src/global/type/type.channel';
import { UserFactory } from '../user/user.factory';

@Injectable()
export class ChannelFactory {
  constructor(private readonly userFactory: UserFactory) {}
  channels: Map<string, ChannelModel> = new Map();

  findChannelById(id: string): ChannelModel {
    return this.channels.get(id);
  }

  findChannelByChannelName(name: string): ChannelModel {
    this.channels.forEach((channel) => {
      if (channel.name === name) {
        return channel;
      }
    });
    return null;
  }

  create(user: UserModel, channel: ChannelModel): boolean {
    if (!this.channels.get(channel.id)) {
      channel.ownerId = user.id;
      this.join(user, channel);
      this.userFactory.joinChannel(user, channel);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  join(user: UserModel, channel: ChannelModel): boolean {
    if (
      channel.maxHeadCount !== channel.users.size &&
      !channel.users.has(user.id)
    ) {
      channel.users.set(user.id, user.id);
      this.userFactory.joinChannel(user, channel);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  leave(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.users.delete(user.id);
      this.userFactory.leaveChannel(user);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  setMute(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.muteList.set(user.id, user.id);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  unsetMute(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.muteList.delete(user.id);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  setBan(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.banList.set(user.id, user.id);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  unsetBan(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.banList.delete(user.id);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  updateType(type: ChannelType, channel: ChannelModel): void {
    channel.type = type;
    this.channels.set(channel.id, channel);
  }

  updatePassword(password: string, channel: ChannelModel): void {
    channel.password = password;
    this.channels.set(channel.id, channel);
  }

  setAdmin(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.adminList.set(user.id, user.id);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  unsetAdmin(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.has(user.id)) {
      channel.adminList.set(user.id, user.id);
      this.channels.set(channel.id, channel);
      return true;
    }
    return false;
  }

  delete(channel: ChannelModel): boolean {
    channel.users.forEach((user) =>
      this.userFactory.leaveChannel(this.userFactory.users.get(user)),
    );
    return this.channels.delete(channel.id);
  }
}
