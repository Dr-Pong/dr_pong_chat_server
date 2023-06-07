import {
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
  ChannelType,
} from 'src/global/type/type.channel';
import { PatchChannelDto } from './patch.channel.dto';

export class UpdateChannelDto {
  channelId: string;
  type: ChannelType;
  password: string;

  constructor(channelId: string, type: ChannelType, password: string) {
    this.channelId = channelId;
    this.type = type;
    this.password = password;
  }

  static fromPatchDto(dto: PatchChannelDto): UpdateChannelDto {
    let type: ChannelType = dto.access;
    if (type === CHANNEL_PUBLIC && dto.password) type = CHANNEL_PROTECTED;
    let password: string = null;
    if (type === CHANNEL_PROTECTED) password = dto.password;
    return new UpdateChannelDto(dto.channelId, type, password);
  }
}
