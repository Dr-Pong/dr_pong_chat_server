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
import { ChannelInviteModel } from './model/channel.invite.model';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_NORMAL,
  CHANNEL_PARTICIPANT_OWNER,
} from '../channel/type/type.channel-participant';
import {
  GATEWAY_CHANNEL,
  GATEWAY_DIRECTMESSAGE,
  GATEWAY_FRIEND,
  GATEWAY_NOTIFICATION,
  GateWayType,
} from 'src/gateway/type/type.gateway';
import { GameInviteModel } from './model/game.invite.model';
import { GameModel } from './model/game.model';

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
    if (channel.muteList.has(user.id)) {
      user.isMuted = true;
    }
    user.roleType = CHANNEL_PARTICIPANT_NORMAL;
  }

  leaveChannel(userId: number): void {
    const user: UserModel = this.findById(userId);
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
    switch (type) {
      case GATEWAY_NOTIFICATION:
        user.notificationSocket.set(socket.id, socket.id);
        break;
      case GATEWAY_CHANNEL:
        user.channelSocket.set(socket.id, socket.id);
        break;
      case GATEWAY_FRIEND:
        user.friendSocket.set(socket.id, socket.id);
        break;
      case GATEWAY_DIRECTMESSAGE:
        user.dmSocket.set(socket.id, socket.id);
        break;
    }
    if (socket && user.playingGame) {
      user.status = USERSTATUS_INGAME;
    } else if (socket) {
      user.status = USERSTATUS_ONLINE;
    } else if (!user.notificationSocket.size) {
      user.status = USERSTATUS_OFFLINE;
    }
  }

  deleteSocket(userId: number, type: GateWayType, socket: Socket): void {
    const user: UserModel = this.findById(userId);
    switch (type) {
      case GATEWAY_NOTIFICATION:
        user.notificationSocket.delete(socket.id);
        break;
      case GATEWAY_CHANNEL:
        user.channelSocket.delete(socket.id);
        break;
      case GATEWAY_FRIEND:
        user.friendSocket.delete(socket.id);
        break;
      case GATEWAY_DIRECTMESSAGE:
        user.dmSocket.delete(socket.id);
        break;
    }
    if (!user.notificationSocket.size) {
      user.status = USERSTATUS_OFFLINE;
    }
  }

  setStatus(userId: number, status: UserStatusType): void {
    const user: UserModel = this.findById(userId);
    user.status = status;
  }

  setGame(userId: number, game: GameModel): void {
    const user: UserModel = this.findById(userId);
    user.playingGame = game;
  }

  updateProfile(userId: number, profileImage: string): void {
    const user: UserModel = this.findById(userId);
    user.profileImage = profileImage;
  }

  inviteChannel(userId: number, invite: ChannelInviteModel): void {
    const user: UserModel = this.findById(userId);
    if (!user.channelInviteList.has(invite.channelId)) {
      user.channelInviteList.set(invite.channelId, invite);
    }
  }

  getChannelInvites(userId: number): ChannelInviteModel[] {
    const user: UserModel = this.findById(userId);
    return Array.from(user.channelInviteList.values());
  }

  deleteChannelInvite(userId: number, channelId: string): void {
    const user: UserModel = this.findById(userId);
    if (user.channelInviteList.has(channelId)) {
      user.channelInviteList.delete(channelId);
    }
  }

  inviteGame(
    senderId: number,
    receiverId: number,
    invite: GameInviteModel,
  ): void {
    const sender: UserModel = this.findById(senderId);
    const receiver: UserModel = this.findById(receiverId);
    sender.gameInvite = invite;
    receiver.gameInviteList.set(invite.id, invite);
  }

  getGameInvites(userId: number): GameInviteModel[] {
    const user: UserModel = this.findById(userId);
    return Array.from(user.gameInviteList.values());
  }

  deleteGameInviteBySenderId(senderId: number): void {
    const sender: UserModel = this.findById(senderId);
    const receiver: UserModel = this.findById(sender?.gameInvite?.receiverId);
    if (!sender || !receiver) return;
    receiver.gameInviteList.delete(sender.gameInvite.id);
    sender.gameInvite = null;
  }

  setDirectMessageFriendId(userId: number, friendId: number): void {
    const user: UserModel = this.findById(userId);
    user.directMessageFriendId = friendId;
  }
}
