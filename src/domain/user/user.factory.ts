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

  joinChannel(userId: number, channel: ChannelModel): void {
    const user: UserModel = this.findById(userId);
    user.joinedChannel = channel.id;
    if (channel.muteList.has(user.id)) {
      user.isMuted = true;
    }
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
    this.users.set(user.id, user);
  }

  leaveChannel(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.joinedChannel = null;
    user.isMuted = false;
    user.roleType = null;
    this.users.set(user.id, user);
  }

  setOwner(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.roleType = CHANNEL_PARTICIPANT_OWNER;
    this.users.set(user.id, user);
  }

  mute(userId: number) {
    const user: UserModel = this.findById(userId);
    user.isMuted = true;
    this.users.set(user.id, user);
  }

  unMute(userId: number) {
    const user: UserModel = this.findById(userId);
    user.isMuted = false;
    this.users.set(user.id, user);
  }

  setAdmin(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.roleType = CHANNEL_PARTICIPANT_ADMIN;
    this.users.set(user.id, user);
  }

  unSetAdmin(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
    this.users.set(user.id, user);
  }

  block(userId: number, targetId: number): boolean {
    const user: UserModel = this.findById(userId);
    const target: UserModel = this.findById(targetId);
    if (!user.blockedList.has(target.id)) {
      user.blockedList.set(target.id, target.id);
      this.users.set(user.id, user);
      return true;
    }
    return false;
  }

  unblock(userId: number, targetId: number): boolean {
    const user: UserModel = this.findById(userId);
    const target: UserModel = this.findById(targetId);
    if (user.blockedList.has(target.id)) {
      user.blockedList.delete(target.id);
      this.users.set(user.id, user);
      return true;
    }
    return false;
  }

  setSocket(userId: number, socket: Socket): void {
    const user: UserModel = this.findById(userId);
    user.socket = socket;
    this.users.set(user.id, user);
  }

  updateProfile(userId: number, profileImage: string): void {
    const user: UserModel = this.findById(userId);
    user.profileImage = profileImage;
    this.users.set(user.id, user);
  }

  setStatus(userId: number, status: UserStatusType): void {
    const user: UserModel = this.findById(userId);
    user.status = status;
    this.users.set(user.id, user);
  }

  invite(userId: number, invite: InviteModel): void {
    const user: UserModel = this.findById(userId);
    if (!user.inviteList.has(invite.channelId)) {
      user.inviteList.set(invite.channelId, invite);
      this.users.set(user.id, user);
    }
  }

  deleteInvite(userId: number, channelId: string): void {
    const user: UserModel = this.findById(userId);
    if (user.inviteList.has(channelId)) {
      user.inviteList.delete(channelId);
      this.users.set(user.id, user);
    }
  }
}
