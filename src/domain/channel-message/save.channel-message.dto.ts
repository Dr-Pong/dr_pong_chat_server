import { CHAT_JOIN, CHAT_LEAVE, ChatType } from 'src/global/type/type.chat';
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
    const { userId, channelId, type, content, time } = messageDto;
    return new SaveChannelMessageDto(userId, channelId, type, content, time);
  }

  static fromJoinDto(joinDto: PostChannelJoinDto): SaveChannelMessageDto {
    const { userId, channelId } = joinDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_JOIN,
      'joined channel',
      new Date(),
    );
  }

  static fromExitDto(exitDto: DeleteChannelUserDto): SaveChannelMessageDto {
    const { userId, channelId } = exitDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_LEAVE,
      'exited channel',
      new Date(),
    );
  }

  constructor(
    userId: number,
    channelId: string,
    type: ChatType,
    content: string,
    time: Date,
  ) {
    this.userId = userId;
    this.channelId = channelId;
    this.type = type;
    this.content = content;
    this.time = time;
  }
}
