import { PostChannelMessageDto } from 'src/domain/channel-message/dto/post.channel-message.dto';
import { CHAT_MESSAGE, ChatType } from 'src/global/type/type.chat';

export class MessageDto {
  userId: number;
  channelId: string;
  type: ChatType;
  content: string;
  time: Date;

  static fromPostDto(postDto: PostChannelMessageDto): MessageDto {
    const { userId, channelId, content } = postDto;
    const type = postDto.type === null ? CHAT_MESSAGE : postDto.type;
    return new MessageDto(userId, channelId, type, content);
  }

  constructor(
    userId: number,
    channelId: string,
    type: ChatType,
    content: string,
  ) {
    this.userId = userId;
    this.channelId = channelId;
    this.type = type;
    this.content = content;
    this.time = new Date();
  }
}
