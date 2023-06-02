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
    const channelModel = new ChannelModel();
    channelModel.id = channel.id;
    channelModel.name = channel.name;
    channelModel.users = new Map();
    channelModel.type = channel.type;
    channelModel.password = channel.password;
    channelModel.ownerId = channel.operator.id;
    channelModel.muteList = new Map();
    channelModel.banList = new Map();
    channelModel.adminList = new Map();
    channelModel.maxHeadCount = channel.maxHeadCount;
    return channelModel;
  }
}
