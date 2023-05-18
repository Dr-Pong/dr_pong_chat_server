import { Injectable } from '@nestjs/common';
import { ChannelModel } from './channel.model';
import { UserModel } from '../user/user.model';
import { ChannelType } from 'src/global/type/type.channel';

@Injectable()
export class ChannelFactory {
  channels: Map<string, ChannelModel> = new Map();

  findChannelByChannelName(name: string): ChannelModel {
    return this.channels.get(name);
  }

  create(user: UserModel, channel: ChannelModel): boolean {
    if (!this.channels.get(channel.name)) {
      channel.ownerId = user.id;
      this.join(user, channel);
      this.channels.set(channel.name, channel);
      return true;
    }
    return false;
  }

  join(user: UserModel, channel: ChannelModel): boolean {
    if (
      channel.maxHeadCount !== channel.users.size &&
      !channel.users.get(user.id)
    ) {
      channel.users.set(user.id, user);
      return true;
    }
    return false;
  }

  leave(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.get(user.id)) {
      channel.users.delete(user.id);
      return true;
    }
    return false;
  }

  setMute(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.get(user.id)) {
      channel.muteList.push(user.id);
      return true;
    }
    return false;
  }

  unsetMute(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.get(user.id)) {
      channel.muteList = channel.muteList.filter((id) => {
        user.id !== id;
      });
      return true;
    }
    return false;
  }

  setBan(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.get(user.id)) {
      channel.banList.push(user.id);
      return true;
    }
    return false;
  }

  unsetBan(user: UserModel, channel: ChannelModel) {
    if (channel.users.get(user.id)) {
      channel.banList = channel.banList.filter((id) => {
        user.id !== id;
      });
      return true;
    }
    return false;
  }

  updateType(type: ChannelType, channel: ChannelModel): void {
    channel.type = type;
  }

  updatePassword(password: string, channel: ChannelModel): void {
    channel.password = password;
  }

  setAdmin(user: UserModel, channel: ChannelModel): boolean {
    if (channel.users.get(user.id)) {
      channel.adminList.push(user.id);
      return true;
    }
    return false;
  }

  unsetAdmin(user: UserModel, channel: ChannelModel) {
    channel.adminList.push(user.id);
  }

  delete(channel: ChannelModel): boolean {
    return this.channels.delete(channel.name);
  }
}
