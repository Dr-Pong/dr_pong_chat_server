import { ChannelActionType } from 'src/domain/channel/type/type.channel.action';

export class PostChannelMessageDto {
  userId: number;
  channelId: string;
  type: ChannelActionType;
  content: string;
}
