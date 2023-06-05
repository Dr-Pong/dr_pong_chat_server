import { Socket } from 'socket.io';
import {
  USERSTATUS_OFFLINE,
  UserStatusType,
} from 'src/global/type/type.user.status';
import { User } from '../../user/user.entity';
import { ChannelParticipantType } from 'src/global/type/type.channel-participant';
import { InviteModel } from './invite.model';

export class UserModel {
  id: number;
  nickname: string;
  joinedChannel: string;
  blockedList: Map<number, number>;
  inviteList: Map<string, InviteModel>;
  roleType: ChannelParticipantType;
  isMuted: boolean;
  socket: Socket;
  profileImage: string;
  status: UserStatusType;

  static fromEntity(user: User): UserModel {
    const userModel = new UserModel();
    userModel.id = user.id;
    userModel.nickname = user.nickname;
    userModel.joinedChannel = null;
    userModel.blockedList = new Map();
    userModel.inviteList = new Map();
    userModel.roleType = null;
    userModel.isMuted = false;
    userModel.socket = null;
    userModel.profileImage = user.image.url;
    userModel.status = USERSTATUS_OFFLINE;
    return userModel;
  }
}
