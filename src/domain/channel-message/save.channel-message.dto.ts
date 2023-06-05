import { CHAT_JOIN, ChatType } from 'src/global/type/type.chat';
import { MessageDto } from 'src/gateway/dto/message.dto';
import { PostChannelJoinDto } from '../channel-user/dto/post.channel.join.dto';
import { DeleteChannelUserDto } from '../channel-user/dto/delete.channel.user.dto';

export class SaveChannelMessageDto {
  userId: number;
  channelId: string;
  type: ChatType;
  content: string;
  time: Date;

  static fromMessageDto(messageDto: MessageDto): SaveChannelMessageDto {
    const dto = new SaveChannelMessageDto();
    dto.userId = messageDto.userId;
    dto.channelId = messageDto.channelId;
    dto.type = messageDto.type;
    dto.content = messageDto.content;
    dto.time = messageDto.time;
    return dto;
  }

  static fromJoinDto(joinDto: PostChannelJoinDto): SaveChannelMessageDto {
    const dto = new SaveChannelMessageDto();
    dto.userId = joinDto.userId;
    dto.channelId = joinDto.channelId;
    dto.type = CHAT_JOIN;
    dto.content = 'joined channel';
    dto.time = new Date();
    return dto;
  }

  static fromExitDto(exitDto: DeleteChannelUserDto): SaveChannelMessageDto {
    const dto = new SaveChannelMessageDto();
    dto.userId = exitDto.userId;
    dto.channelId = exitDto.channelId;
    dto.type = CHAT_JOIN;
    dto.content = 'exited channel';
    dto.time = new Date();
    return dto;
  }
}
