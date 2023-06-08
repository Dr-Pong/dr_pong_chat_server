import { GetChannelMessageHistoryDto } from './get.channel-message.history.dto';

export class FindChannelMessagePageDto {
  channelId: string;
  offset: number;
  count: number;

  static from(dto: GetChannelMessageHistoryDto): FindChannelMessagePageDto {
    return new FindChannelMessagePageDto(dto.channelId, dto.offset, dto.count);
  }

  constructor(channelId: string, offset: number, count: number) {
    this.channelId = channelId;
    this.offset = offset;
    this.count = count;
  }
}
