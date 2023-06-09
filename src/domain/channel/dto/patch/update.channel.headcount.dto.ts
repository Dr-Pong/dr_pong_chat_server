export class UpdateChannelHeadCountDto {
  channelId: string;
  headCount: number;

  constructor(channelId: string, headCount: number) {
    this.channelId = channelId;
    this.headCount = headCount;
  }
}
