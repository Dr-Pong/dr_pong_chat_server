export class GetDirectMessageHistoryDto {
  userId: number;
  friendId: number;
  offset: number | null; //chat id
  count: number;
}
