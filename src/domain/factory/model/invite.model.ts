import { uuid } from 'uuid-with-v6';

export class InviteModel {
  id: string;
  channelId: string;
  channelName: string;
  from: string;
  createdAt: Date;

  constructor(channelId: string, channelName: string, from: string) {
    this.id = uuid.v6();
    this.channelId = channelId;
    this.channelName = channelName;
    this.from = from;
    this.createdAt = new Date();
  }
}
