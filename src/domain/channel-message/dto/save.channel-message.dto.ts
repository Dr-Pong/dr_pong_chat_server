import {
  CHAT_BAN,
  CHAT_JOIN,
  CHAT_KICK,
  CHAT_LEAVE,
  CHAT_MUTE,
  CHAT_SETADMIN,
  CHAT_UNMUTE,
  CHAT_UNSETADMIN,
  ChannelActionType,
} from 'src/global/type/type.channel.action';
import { MessageDto } from 'src/gateway/dto/message.dto';
import { PostChannelJoinDto } from 'src/domain/channel-user/dto/post.channel.join.dto';
import { DeleteChannelUserDto } from 'src/domain/channel-user/dto/delete.channel.user.dto';
import { ChannelAdminCommandDto } from 'src/domain/channel-user/dto/channel.admin.command.dto';
import { PostChannelMuteDto } from 'src/domain/channel-user/dto/post.channel.mute.dto';
import { DeleteChannelMuteDto } from 'src/domain/channel-user/dto/delete.channel.mute.dto';
import { PostChannelBanDto } from 'src/domain/channel-user/dto/post.channel.ban.dto';
import { DeleteChannelKickDto } from 'src/domain/channel-user/dto/delete.channel.kick.dto';
import { PostChannelAdminDto } from 'src/domain/channel-user/dto/post.channel.admin.dto';
import { DeleteChannelAdminDto } from 'src/domain/channel-user/dto/delete.channel.admin.dto';

export class SaveChannelMessageDto {
  userId: number;
  channelId: string;
  type: ChannelActionType;
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
      CHAT_JOIN,
      new Date(),
    );
  }

  static fromExitDto(exitDto: DeleteChannelUserDto): SaveChannelMessageDto {
    const { userId, channelId } = exitDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_LEAVE,
      CHAT_LEAVE,
      new Date(),
    );
  }

  static fromCommandDto(dto: ChannelAdminCommandDto): SaveChannelMessageDto {
    const { targetUserId: userId, channelId } = dto;
    let type: ChannelActionType;
    switch (dto.getType()) {
      case PostChannelMuteDto.name:
        type = CHAT_MUTE;
        break;
      case DeleteChannelMuteDto.name:
        type = CHAT_UNMUTE;
        break;
      case PostChannelBanDto.name:
        type = CHAT_BAN;
        break;
      case DeleteChannelKickDto.name:
        type = CHAT_KICK;
        break;
      case PostChannelAdminDto.name:
        type = CHAT_SETADMIN;
        break;
      case DeleteChannelAdminDto.name:
        type = CHAT_UNSETADMIN;
        break;
    }
    return new SaveChannelMessageDto(userId, channelId, type, type, new Date());
  }

  constructor(
    userId: number,
    channelId: string,
    type: ChannelActionType,
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
