import {
  CHAT_BAN,
  CHAT_JOIN,
  CHAT_KICK,
  CHAT_LEAVE,
  CHAT_MUTE,
  CHAT_SETADMIN,
  CHAT_UNSETADMIN,
  ChatType,
} from 'src/global/type/type.chat';
import { MessageDto } from 'src/gateway/dto/message.dto';
import { PostChannelJoinDto } from '../channel-user/dto/post.channel.join.dto';
import { DeleteChannelUserDto } from '../channel-user/dto/delete.channel.user.dto';
import { PostChannelAdminDto } from '../channel-user/dto/post.channel.admin.dto';
import { DeleteChannelAdminDto } from '../channel-user/dto/delete.channel.admin.dto';
import { DeleteChannelKickDto } from '../channel-user/dto/delete.channel.kick.dto';
import { PostChannelBanDto } from '../channel-user/dto/post.channel.ban.dto';
import { PostChannelMuteDto } from '../channel-user/dto/post.channel.mute.dto';

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

  static fromMuteDto(muteDto: PostChannelMuteDto): SaveChannelMessageDto {
    const { targetUserId: userId, channelId } = muteDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_MUTE,
      'is muted',
      new Date(),
    );
  }

  static fromKickDto(kickDto: DeleteChannelKickDto): SaveChannelMessageDto {
    const { targetUserId: userId, channelId } = kickDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_KICK,
      'is kicked',
      new Date(),
    );
  }

  static fromBanDto(banDto: PostChannelBanDto): SaveChannelMessageDto {
    const { targetUserId: userId, channelId } = banDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_BAN,
      'is banned',
      new Date(),
    );
  }

  static fromPostAdminDto(postDto: PostChannelAdminDto): SaveChannelMessageDto {
    const { targetUserId: userId, channelId } = postDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_SETADMIN,
      'is admin now',
      new Date(),
    );
  }

  static fromDeleteAdminDto(
    deleteDto: DeleteChannelAdminDto,
  ): SaveChannelMessageDto {
    const { targetUserId: userId, channelId } = deleteDto;
    return new SaveChannelMessageDto(
      userId,
      channelId,
      CHAT_UNSETADMIN,
      'is not admin anymore',
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
