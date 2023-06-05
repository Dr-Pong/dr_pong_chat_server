interface Chat {
  id: number;
  message: string;
  nickname: string;
  createdAt: Date;
}
export class FriendDmChatlistResponseDto {
  chatList: Chat[];
  isLastPage: boolean;
}
