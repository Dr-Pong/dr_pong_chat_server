import { ChannelType } from 'src/global/type/type.channel';
import { UserModel } from '../user/user.model';

export class ChannelModel {
  name: string;
  users: Map<number, UserModel> = new Map();
  type: ChannelType;
  password: string;
  ownerId: number;
  muteList: number[];
  banList: number[];
  adminList: number[];
  maxHeadCount: number;
}
