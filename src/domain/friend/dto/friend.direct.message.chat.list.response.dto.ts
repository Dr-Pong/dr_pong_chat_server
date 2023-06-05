interface Chat {
  id: number;
  message: string;
  nickname: string;
  createdAt: Date;
}

export class FriendDirectMessageChatListResponseDto {
  chatList: Chat[];
  isLastPage: boolean;
}
