import { ChannelModel } from 'src/domain/factory/model/channel.model';

export class ChannelMeDto {
  id: string;
  title: string;
  headCount: number;
  maxCount: number;

  static fromModel(channel: ChannelModel): ChannelMeDto {
    if (!channel) return null;

    const { id, name: title, maxHeadCount: maxCount } = channel;

    return new ChannelMeDto(id, title, channel.users.size, maxCount);
  }

  constructor(id: string, title: string, headCount: number, maxCount: number) {
    this.id = id;
    this.title = title;
    this.headCount = headCount;
    this.maxCount = maxCount;
  }
}
