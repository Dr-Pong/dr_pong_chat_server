import { ChannelMessage } from 'src/domain/channel/entity/channel-message.entity';
import { CHAT_MESSAGE } from 'src/domain/channel/type/type.channel.action';
import {
  CHATTYPE_ME,
  CHATTYPE_OTHERS,
  CHATTYPE_SYSTEM,
  ChatType,
} from 'src/global/type/type.chat';

export class ChannelMessageDto {
  id: number;
  message: string;
  nickname: string;
  time: Date;
  type: ChatType;

  static fromEntity(userId: number, entity: ChannelMessage): ChannelMessageDto {
    let type: ChatType;
    if (entity.type === CHAT_MESSAGE) {
      type = userId === entity.user.id ? CHATTYPE_ME : CHATTYPE_OTHERS;
    } else {
      type = CHATTYPE_SYSTEM;
    }

    return new ChannelMessageDto(
      entity.id,
      entity.content,
      entity.user.nickname,
      entity.time,
      type,
    );
  }

  constructor(
    id: number,
    message: string,
    nickname: string,
    time: Date,
    type: ChatType,
  ) {
    this.id = id;
    this.message = message;
    this.nickname = nickname;
    this.time = time;
    this.type = type;
  }
}

export class ChannelMessagesHistoryDto {
  chats: ChannelMessageDto[];
  isLastPage: boolean;
}
