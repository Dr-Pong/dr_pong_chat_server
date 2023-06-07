import { ChannelActionType } from 'src/global/type/type.channel.action';

export class PostChannelMessageDto {
  userId: number;
  channelId: string;
  type: ChannelActionType;
  content: string;
}
