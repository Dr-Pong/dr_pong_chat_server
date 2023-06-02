import { Injectable } from '@nestjs/common';
import { UserModel } from './user.model';
import { ChannelModel } from '../channel/channel.model';
import { Socket } from 'socket.io';
import { UserStatusType } from 'src/global/type/type.user.status';
import { InviteModel } from './invite.model';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_NORMAL,
  CHANNEL_PARTICIPANT_OWNER,
} from 'src/global/type/type.channel-participant';

@Injectable()
export class UserFactory {
  users: Map<number, UserModel> = new Map();

  findById(id: number): UserModel {
    return this.users.get(id);
  }

  joinChannel(user: UserModel, channel: ChannelModel): void {
    user.joinedChannel = channel.id;
    if (channel.muteList.has(user.id)) {
      user.isMuted = true;
    }
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
    this.users.set(user.id, user);
  }

  leaveChannel(user: UserModel): void {
    user.joinedChannel = null;
    user.isMuted = false;
    user.roleType = null;
    this.users.set(user.id, user);
  }

  setOwner(user: UserModel): void {
    user.roleType = CHANNEL_PARTICIPANT_OWNER;
    this.users.set(user.id, user);
  }

  mute(user: UserModel) {
    user.isMuted = true;
    this.users.set(user.id, user);
  }

  unMute(user: UserModel) {
    user.isMuted = false;
    this.users.set(user.id, user);
  }

  setAdmin(user: UserModel): void {
    user.roleType = CHANNEL_PARTICIPANT_ADMIN;
    this.users.set(user.id, user);
  }

  unSetAdmin(user: UserModel): void {
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
    this.users.set(user.id, user);
  }

  block(user: UserModel, target: UserModel): boolean {
    if (!user.blockedList.has(target.id)) {
      user.blockedList.set(target.id, target.id);
      this.users.set(user.id, user);
      return true;
    }
    return false;
  }

  unblock(user: UserModel, target: UserModel): boolean {
    if (user.blockedList.has(target.id)) {
      user.blockedList.delete(target.id);
      this.users.set(user.id, user);
      return true;
    }
    return false;
  }

  setSocket(user: UserModel, socket: Socket): void {
    user.socket = socket;
    this.users.set(user.id, user);
  }

  updateProfile(user: UserModel, profileImage: string): void {
    user.profileImage = profileImage;
    this.users.set(user.id, user);
  }

  setStatus(user: UserModel, status: UserStatusType): void {
    user.status = status;
    this.users.set(user.id, user);
  }

  invite(user: UserModel, invite: InviteModel): void {
    if (!user.inviteList.has(invite.channelId)) {
      user.inviteList.set(invite.channelId, invite);
      this.users.set(user.id, user);
    }
  }
}
