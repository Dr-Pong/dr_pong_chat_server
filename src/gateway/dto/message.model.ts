import { ChatType } from 'src/global/type/type.chat';

export class MessageModel {
  id: number;
  message: string;
  nickname: string;
  time: Date;
  type: ChatType;

  constructor(nickname: string, message: string, type: ChatType) {
    this.id = 0;
    this.nickname = nickname;
    this.message = message;
    this.time = new Date();
    this.type = type;
  }
}
