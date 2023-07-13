import { Socket } from 'socket.io';
import {
  USERSTATUS_OFFLINE,
  UserStatusType,
} from 'src/global/type/type.user.status';
import { User } from '../../user/user.entity';
import { InviteModel } from './invite.model';
import { ChannelParticipantType } from 'src/domain/channel/type/type.channel-participant';

export class UserModel {
  id: number;
  gameId: string;
  nickname: string;
  joinedChannel: string;
  blockedList: Map<number, number>;
  inviteList: Map<string, InviteModel>;
  roleType: ChannelParticipantType;
  isMuted: boolean;
  socket: Map<string, Socket>;
  profileImage: string;
  status: UserStatusType;
  directMessageFriendId: number;

  static fromEntity(user: User): UserModel {
    const { id, nickname } = user;
    const profileImage: string = user.image.url;
    return new UserModel(id, nickname, profileImage);
  }

  constructor(id: number, nickname: string, profileImage: string) {
    this.id = id;
    this.nickname = nickname;
    this.joinedChannel = null;
    this.blockedList = new Map<number, number>();
    this.inviteList = new Map<string, InviteModel>();
    this.roleType = null;
    this.isMuted = false;
    this.socket = new Map<string, Socket>();
    this.profileImage = profileImage;
    this.status = USERSTATUS_OFFLINE;
  }
}
