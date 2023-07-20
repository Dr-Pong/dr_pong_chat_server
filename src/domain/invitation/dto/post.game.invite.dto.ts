import { GameMode } from '../../../global/type/type.game';

export class PostGameInviteDto {
  senderId: number;
  receiverId: number;
  mode: GameMode;

  constructor(senderId: number, receiverId: number, mode: GameMode) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.mode = mode;
  }
}
