import { ChannelMessageHistoryDto } from './channel-message.history.dto';

export class ChannelChatsResponseDto {
  chats: ChannelMessageHistoryDto[];
  isLastPage: boolean;
}
