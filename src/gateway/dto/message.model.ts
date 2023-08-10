import { ChatType } from 'src/global/type/type.chat';

export class MessageModel {
  id: string;
  message: string;
  nickname: string;
  time: Date;
  type: ChatType;

  constructor(id: number, nickname: string, message: string, type: ChatType) {
    this.id = id.toString();
    this.nickname = nickname;
    this.message = message;
    this.time = new Date();
    this.type = type;
  }
}
