import { UserModel } from 'src/domain/user/user.model';
import { ChannelParticipantType } from 'src/global/type/type.channel-participant';

export class ChannelParticipantDto {
  nickname: string;
  imageUrl: string;
  roleType: ChannelParticipantType;
  isMuted: boolean;

  static fromModel(userModel: UserModel): ChannelParticipantDto {
    const channelParticipantDto: ChannelParticipantDto =
      new ChannelParticipantDto();
    channelParticipantDto.nickname = userModel.nickname;
    channelParticipantDto.imageUrl = userModel.profileImage;
    channelParticipantDto.roleType = userModel.roleType;
    channelParticipantDto.isMuted = userModel.isMuted;
    return channelParticipantDto;
  }
}

export class ChannelParticipantDtos {
  me: ChannelParticipantDto;
  participants: ChannelParticipantDto[];
  headCount: number;
  maxHeadCount: number;
}
