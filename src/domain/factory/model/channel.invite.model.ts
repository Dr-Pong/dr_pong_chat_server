import { v4 as uuid } from 'uuid';

export class ChannelInviteModel {
  id: string;
  channelId: string;
  channelName: string;
  from: string;
  createdAt: Date;

  constructor(channelId: string, channelName: string, from: string) {
    this.id = uuid();
    this.channelId = channelId;
    this.channelName = channelName;
    this.from = from;
    this.createdAt = new Date();
  }
}
