import { ChannelModel } from 'src/domain/channel/channel.model';

export class ChannelMeDto {
  id: string;
  title: string;
  headCount: number;
  maxCount: number;

  static fromModel(channel: ChannelModel): ChannelMeDto {
    if (!channel) return null;

    const dto: ChannelMeDto = new ChannelMeDto();
    dto.id = channel.id;
    dto.title = channel.name;
    dto.headCount = channel.users.size;
    dto.maxCount = channel.maxHeadCount;
    return dto;
  }
}
