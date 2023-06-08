import { ChatType } from 'src/global/type/type.chat';

export class ChatDto {
  id: number;
  nickname: string;
  message: string;
  time: Date;
  type: ChatType;
}

export class GetDirectMessageHistoryResponseDto {
  chats: ChatDto[];
  isLastPage: boolean;
}
