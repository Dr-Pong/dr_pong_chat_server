export class ChatDto {
  id: number;
  nickname: string;
  message: string;
  createdAt: Date;
}

export class GetDirectMessageHistoryResponseDto {
  chats: ChatDto[];
}
