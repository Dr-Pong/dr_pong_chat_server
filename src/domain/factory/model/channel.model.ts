import { ChannelType } from 'src/global/type/type.channel';
import { Channel } from '../../channel/channel.entity';

export class ChannelModel {
  id: string;
  name: string;
  users: Map<number, number>;
  type: ChannelType;
  password: string;
  ownerId: number;
  muteList: Map<number, number>;
  banList: Map<number, number>;
  adminList: Map<number, number>;
  maxHeadCount: number;

  static fromEntity(channel: Channel): ChannelModel {
    const { id, name, type, password, maxHeadCount } = channel;
    const ownerId: number = channel.operator.id;

    return new ChannelModel(id, name, type, password, ownerId, maxHeadCount);
  }

  constructor(
    id: string,
    name: string,
    type: ChannelType,
    password: string,
    ownerId: number,
    maxHeadCount: number,
  ) {
    this.id = id;
    this.name = name;
    this.users = new Map();
    this.type = type;
    this.password = password;
    this.ownerId = ownerId;
    this.muteList = new Map();
    this.banList = new Map();
    this.adminList = new Map();
    this.maxHeadCount = maxHeadCount;
  }
}
