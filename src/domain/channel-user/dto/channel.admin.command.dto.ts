export class ChannelAdminCommandDto {
  requestUserId: number;
  channelId: string;
  targetUserId: number;

  typeof(): string {
    return ChannelAdminCommandDto.name;
  }

  constructor(requestUserId: number, channelId: string, targetUserId: number) {
    this.requestUserId = requestUserId;
    this.channelId = channelId;
    this.targetUserId = targetUserId;
  }
}
