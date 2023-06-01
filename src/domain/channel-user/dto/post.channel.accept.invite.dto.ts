export class PostChannelAcceptInviteDto {
  userId: number;
  inviteId: string;

  constructor(userId: number, inviteId: string) {
    this.userId = userId;
    this.inviteId = inviteId;
  }
}
