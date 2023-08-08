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
  /** user 정보 관련 */
  id: number;
  nickname: string;
  profileImage: string;
  status: UserStatusType;
  playingGame: GameModel;

  /** 채팅방에서 필요한 정보 */
  isMuted: boolean;
  joinedChannel: string;
  directMessageFriendId: number;
  roleType: ChannelParticipantType;
  channelInviteList: Map<string, ChannelInviteModel>;
  blockedList: Map<number, number>;

  /** 알림에서 필요한 정보 */
  gameInviteList: Map<string, GameInviteModel>;
  gameInvite: GameInviteModel;
  notificationSocket: Map<string, string>;
  channelSocket: Map<string, string>;
  friendSocket: Map<string, string>;
  dmSocket: Map<string, string>;

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
    this.notificationSocket = new Map<string, string>();
    this.channelSocket = new Map<string, string>();
    this.friendSocket = new Map<string, string>();
    this.dmSocket = new Map<string, string>();
    this.profileImage = profileImage;
    this.status = USERSTATUS_OFFLINE;
  }
}
