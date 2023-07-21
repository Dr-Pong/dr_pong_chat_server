import { GameMode, GameType } from 'src/global/type/type.game';

export class GameModel {
  id: string;
  type: GameType;
  mode: GameMode;

  constructor(id: string, type: GameType, mode: GameMode) {
    this.id = id;
    this.type = type;
    this.mode = mode;
  }
}
