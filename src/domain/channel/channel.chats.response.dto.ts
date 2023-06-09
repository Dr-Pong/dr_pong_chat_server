import { ChannelMessageHistoryDto } from './dto/channel-message.history.dto';

export class ChannelChatsResponseDto {
  chats: ChannelMessageHistoryDto[];
  isLastPage: boolean;
}
