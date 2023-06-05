import { UserModel } from 'src/domain/factory/model/user.model';
import { ChannelParticipantType } from 'src/global/type/type.channel-participant';

export class ChannelParticipantDto {
  nickname: string;
  imgUrl: string;
  roleType: ChannelParticipantType;
  isMuted: boolean;

  static fromModel(userModel: UserModel): ChannelParticipantDto {
    const { nickname, profileImage, roleType, isMuted } = userModel;
    return new ChannelParticipantDto(nickname, profileImage, roleType, isMuted);
  }

  constructor(
    nickname: string,
    imgUrl: string,
    roleType: ChannelParticipantType,
    isMuted: boolean,
  ) {
    this.nickname = nickname;
    this.imgUrl = imgUrl;
    this.roleType = roleType;
    this.isMuted = isMuted;
  }
}

export class ChannelParticipantDtos {
  me: ChannelParticipantDto;
  participants: ChannelParticipantDto[] = [];
  headCount: number;
  maxCount: number;
}
