export class ChatDto {
  nickname: string;
  message: string;
  createdAt: Date;
}

export class GetDirectMessageHistoryResponseDto {
  chats: ChatDto[];
}
