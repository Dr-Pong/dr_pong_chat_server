import { GameMode } from 'src/global/type/type.game';
import { v4 as uuid } from 'uuid';

export class GameInviteModel {
  id: string;
  senderId: number;
  receiverId: number;
  mode: GameMode;
  createdAt: Date;

  constructor(senderId: number, receiverId: number, mode: GameMode) {
    this.id = uuid();
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.mode = mode;
    this.createdAt = new Date();
  }
}
