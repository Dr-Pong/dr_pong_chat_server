export class PostChannelAcceptInviteDto {
  userId: number;
  channelId: string;

  constructor(userId: number, channelId: string) {
    this.userId = userId;
    this.channelId = channelId;
  }
}
