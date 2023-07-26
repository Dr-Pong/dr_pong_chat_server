import { GameMode } from 'src/global/type/type.game';
import { v4 as uuid } from 'uuid';

export class GameInvitation {
  id: string;
  from: string;
  createdAt: Date;

  constructor(senderNickname: string){
    this.id = uuid();
    this.from = senderNickname;
    this.createdAt = new Date();
  }
}


export default class GameInviteListDto {
  invitations: GameInvitation[];
}
