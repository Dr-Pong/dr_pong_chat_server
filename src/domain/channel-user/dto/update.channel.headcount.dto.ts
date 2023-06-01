import { Channel } from 'src/domain/channel/channel.entity';

export class UpdateChannelHeadCountDto {
  channel: Channel;
  headCount: number;

  constructor(channel: Channel, headCount: number) {
    this.channel = channel;
    this.headCount = headCount;
  }
}
