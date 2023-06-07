import { ChatType } from 'src/global/type/type.chat';

export class PostChannelMessageDto {
  userId: number;
  channelId: string;
  type: ChatType;
  content: string;
}
