import { GameMode } from 'src/global/type/type.game';
import { v4 as uuid } from 'uuid';

export class GameInvitation {
  id: string;
  from: string;
  createdAt: Date;

  constructor(gameId:string ,senderNickname: string){
    this.id = gameId;
    this.from = senderNickname;
    this.createdAt = new Date();
  }
}


export default class GameInviteListDto {
  invitations: GameInvitation[];
}
