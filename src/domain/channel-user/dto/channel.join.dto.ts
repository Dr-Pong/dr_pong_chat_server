export class ChannelJoinDto {
  userId: number;
  channelId: string;
  password: string;

  constructor(userId: number, channelId: string, password: string) {
    this.userId = userId;
    this.channelId = channelId;
    this.password = password;
  }
}
