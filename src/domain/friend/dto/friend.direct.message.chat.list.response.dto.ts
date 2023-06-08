import { ChatType } from 'src/global/type/type.chat';

interface Chat {
  id: number;
  message: string;
  nickname: string;
  time: Date;
  type: ChatType;
}

export class FriendDirectMessageChatListResponseDto {
  chatList: Chat[];
  isLastPage: boolean;
}
