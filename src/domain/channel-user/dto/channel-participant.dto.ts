import { UserModel } from 'src/domain/factory/model/user.model';
import { ChannelParticipantType } from 'src/global/type/type.channel-participant';

export class ChannelParticipantDto {
  nickname: string;
  imgUrl: string;
  roleType: ChannelParticipantType;
  isMuted: boolean;

  static fromModel(userModel: UserModel): ChannelParticipantDto {
    const channelParticipantDto: ChannelParticipantDto =
      new ChannelParticipantDto();
    channelParticipantDto.nickname = userModel.nickname;
    channelParticipantDto.imgUrl = userModel.profileImage;
    channelParticipantDto.roleType = userModel.roleType;
    channelParticipantDto.isMuted = userModel.isMuted;
    return channelParticipantDto;
  }
}

export class ChannelParticipantDtos {
  me: ChannelParticipantDto;
  participants: ChannelParticipantDto[] = [];
  headCount: number;
  maxCount: number;
}
