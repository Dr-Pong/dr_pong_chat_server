import { ChannelMessageDto } from './channel-message.dto';

export class ChannelChatsResponseDto {
  chats: ChannelMessageDto[];
  isLastPage: boolean;
}
