import { PostChannelMessageDto } from 'src/domain/channel-message/post.channel-message.dto';
import { CHAT_MESSAGE, ChatType } from 'src/global/type/type.chat';

export class MessageDto {
  userId: number;
  channelId: string;
  type: ChatType;
  content: string;
  time: Date;

  static fromPostDto(postDto: PostChannelMessageDto): MessageDto {
    const dto = new MessageDto();
    dto.userId = postDto.userId;
    dto.channelId = postDto.channelId;
    dto.type = postDto.type === null ? CHAT_MESSAGE : postDto.type;
    dto.content = postDto.content;
    dto.time = new Date();
    return dto;
  }
}
