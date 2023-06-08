export class GetChannelMessageHistoryDto {
  userId: number;
  channelId: string;
  offset: number;
  count: number;
}
