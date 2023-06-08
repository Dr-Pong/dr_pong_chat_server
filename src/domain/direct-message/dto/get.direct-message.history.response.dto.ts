export class ChatDto {
  id: number;
  nickname: string;
  message: string;
  time: Date;
}

export class GetDirectMessageHistoryResponseDto {
  chats: ChatDto[];
  isLastPage: boolean;
}
