export class DeleteGameInviteDto {
  senderId: number;

  constructor(senderId: number) {
    this.senderId = senderId;
  }
}
