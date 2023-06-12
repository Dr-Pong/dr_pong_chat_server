import { ChannelMessage } from 'src/domain/channel/entity/channel-message.entity';
import { CHAT_MESSAGE } from 'src/domain/channel/type/type.channel.action';
import {
  CHATTYPE_ME,
  CHATTYPE_OTHERS,
  CHATTYPE_SYSTEM,
  ChatType,
} from 'src/global/type/type.chat';

export class ChannelMessageHistoryDto {
  id: number;
  message: string;
  nickname: string;
  time: Date;
  type: ChatType;

  static fromEntity(
    userId: number,
    entity: ChannelMessage,
  ): ChannelMessageHistoryDto {
    let type: ChatType;
    if (entity.type === CHAT_MESSAGE) {
      type = userId === entity.user.id ? CHATTYPE_ME : CHATTYPE_OTHERS;
    } else {
      type = CHATTYPE_SYSTEM;
    }

    return new ChannelMessageHistoryDto(
      entity.id,
      entity.content,
      entity.user.nickname,
      entity.time,
      type,
    );
  }

  constructor(
    userId: number,
    message: string,
    nickname: string,
    time: Date,
    type: ChatType,
  ) {
    this.id = userId;
    this.message = message;
    this.nickname = nickname;
    this.time = time;
    this.type = type;
  }
}

export class ChannelMessagesHistoryDto {
  chats: ChannelMessageHistoryDto[];
  isLastPage: boolean;
}
