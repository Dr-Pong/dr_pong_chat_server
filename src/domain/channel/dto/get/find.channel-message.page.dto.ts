import { UserModel } from 'src/domain/factory/model/user.model';
import { GetChannelMessageHistoryDto } from './get.channel-message.history.dto';

export class FindChannelMessagePageDto {
  blockedList: number[];
  channelId: string;
  offset: number;
  count: number;

  static from(
    dto: GetChannelMessageHistoryDto,
    blockList: number[],
  ): FindChannelMessagePageDto {
    return new FindChannelMessagePageDto(
      dto.channelId,
      dto.offset,
      dto.count + 1,
      blockList,
    );
  }

  constructor(
    channelId: string,
    offset: number,
    count: number,
    blockedList: number[],
  ) {
    this.channelId = channelId;
    this.offset = offset;
    this.count = count;
    this.blockedList = blockedList;
  }
}
