export class ChatListDto {
  nickname: string;
  imgUrl: string;
  newChat: number;
}

export class GetFriendDirectMessageResponseDto {
  chats: ChatListDto[];
}
