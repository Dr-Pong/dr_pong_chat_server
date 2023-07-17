import { GameMode } from '../type/type.game.mode';

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
