import { Injectable } from '@nestjs/common';
import { UserModel } from './model/user.model';
import { ChannelModel } from './model/channel.model';
import { Socket } from 'socket.io';
import {
  USERSTATUS_INGAME,
  USERSTATUS_OFFLINE,
  USERSTATUS_ONLINE,
  UserStatusType,
} from 'src/global/type/type.user.status';
import { InviteModel } from './model/invite.model';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_NORMAL,
  CHANNEL_PARTICIPANT_OWNER,
} from '../channel/type/type.channel-participant';
import { GATEWAY_CHANNEL, GateWayType } from 'src/gateway/type/type.gateway';

@Injectable()
export class UserFactory {
  users: Map<number, UserModel> = new Map();

  findById(id: number): UserModel {
    return this.users.get(id);
  }

  findByNickname(nickname: string): UserModel {
    return Array.from(this.users.values()).find(
      (user: UserModel) => user.nickname === nickname,
    );
  }

  create(user: UserModel) {
    this.users.set(user.id, user);
  }

  joinChannel(userId: number, channel: ChannelModel): void {
    const user: UserModel = this.findById(userId);
    user.joinedChannel = channel.id;
    user.socket[GATEWAY_CHANNEL]?.join(channel.id);
    if (channel.muteList.has(user.id)) {
      user.isMuted = true;
    }
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
  }

  leaveChannel(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.socket[GATEWAY_CHANNEL]?.leave(user.joinedChannel);
    user.joinedChannel = null;
    user.isMuted = false;
    user.roleType = null;
  }

  setOwner(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.roleType = CHANNEL_PARTICIPANT_OWNER;
  }

  mute(userId: number) {
    const user: UserModel = this.findById(userId);
    user.isMuted = true;
  }

  unMute(userId: number) {
    const user: UserModel = this.findById(userId);
    user.isMuted = false;
  }

  setAdmin(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.roleType = CHANNEL_PARTICIPANT_ADMIN;
  }

  unsetAdmin(userId: number): void {
    const user: UserModel = this.findById(userId);
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
  }

  block(userId: number, targetId: number): boolean {
    const user: UserModel = this.findById(userId);
    const target: UserModel = this.findById(targetId);
    if (!user.blockedList.has(target.id)) {
      user.blockedList.set(target.id, target.id);
      return true;
    }
    return false;
  }

  unblock(userId: number, targetId: number): boolean {
    const user: UserModel = this.findById(userId);
    const target: UserModel = this.findById(targetId);
    if (user.blockedList.has(target.id)) {
      user.blockedList.delete(target.id);
      return true;
    }
    return false;
  }

  setSocket(userId: number, type: GateWayType, socket: Socket): void {
    const user: UserModel = this.findById(userId);
    user.socket[type] = socket;
    if (socket && user.gameId) {
      user.status = USERSTATUS_INGAME;
    } else if (socket) {
      user.status = USERSTATUS_ONLINE;
    } else if (!user.socket['notification']) {
      user.status = USERSTATUS_OFFLINE;
    }
  }

  setStatus(userId: number, status: UserStatusType): void {
    const user: UserModel = this.findById(userId);
    user.status = status;
  }

  setGameId(userId: number, gameId: string): void {
    const user: UserModel = this.findById(userId);
    user.gameId = gameId;
  }

  updateProfile(userId: number, profileImage: string): void {
    const user: UserModel = this.findById(userId);
    user.profileImage = profileImage;
  }

  invite(userId: number, invite: InviteModel): void {
    const user: UserModel = this.findById(userId);
    if (!user.inviteList.has(invite.channelId)) {
      user.inviteList.set(invite.channelId, invite);
    }
  }

  getInvites(userId: number): InviteModel[] {
    const user: UserModel = this.findById(userId);
    return Array.from(user.inviteList.values());
  }

  deleteInvite(userId: number, channelId: string): void {
    const user: UserModel = this.findById(userId);
    if (user.inviteList.has(channelId)) {
      user.inviteList.delete(channelId);
    }
  }

  setDirectMessageFriendId(userId: number, friendId: number): void {
    const user: UserModel = this.findById(userId);
    user.directMessageFriendId = friendId;
  }
}
