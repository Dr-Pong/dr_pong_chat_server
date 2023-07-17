import { v4 as uuid } from 'uuid';

export interface GameInvitation {
  id: string;
  from: string;
  createdAt: Date;
}

export default class GameInviteListDto {
  invitations: GameInvitation[];
}
