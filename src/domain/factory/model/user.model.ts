import { Socket } from 'socket.io';
import {
  USERSTATUS_OFFLINE,
  UserStatusType,
} from 'src/global/type/type.user.status';
import { User } from '../../user/user.entity';
import { ChannelInviteModel } from './channel.invite.model';
import { ChannelParticipantType } from 'src/domain/channel/type/type.channel-participant';
import { GameInviteModel } from './game.invite.model';
import { GameModel } from './game.model';

export class UserModel {
  id: number;
  playingGame: GameModel;
  nickname: string;
  joinedChannel: string;
  blockedList: Map<number, number>;
  gameInvite: GameInviteModel;
  gameInviteList: Map<string, GameInviteModel>;
  channelInviteList: Map<string, ChannelInviteModel>;
  roleType: ChannelParticipantType;
  isMuted: boolean;
  socket: Map<string, Map<string, Socket>>;
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
    this.playingGame = null;
    this.nickname = nickname;
    this.joinedChannel = null;
    this.blockedList = new Map<number, number>();
    this.gameInvite = null;
    this.gameInviteList = new Map<string, GameInviteModel>();
    this.channelInviteList = new Map<string, ChannelInviteModel>();
    this.roleType = null;
    this.isMuted = false;
    this.socket = new Map<string, Map<string, Socket>>();
    this.profileImage = profileImage;
    this.status = USERSTATUS_OFFLINE;
  }
}
