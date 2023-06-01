import { ChatType } from 'src/global/type/type.chat';
import { PostChannelMessageDto } from './post.channel-message.dto';

export class SaveChannelMessageDto {
  userId: number;
  channelId: string;
  type: ChatType;
  content: string;
  time: Date;

  static from(saveDto: PostChannelMessageDto): SaveChannelMessageDto {
    const dto = new SaveChannelMessageDto();
    dto.userId = saveDto.userId;
    dto.channelId = saveDto.channelId;
    dto.type = saveDto.type;
    dto.content = saveDto.content;
    dto.time = new Date();
    return dto;
  }
}
