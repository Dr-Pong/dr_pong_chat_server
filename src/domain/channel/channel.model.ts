import { ChannelType } from 'src/global/type/type.channel';

export class ChannelModel {
  id: number;
  name: string;
  users: Set<number> = new Set();
  type: ChannelType;
  password: string;
  ownerId: number;
  muteList: number[];
  banList: number[];
  adminList: number[];
  maxHeadCount: number;
}
