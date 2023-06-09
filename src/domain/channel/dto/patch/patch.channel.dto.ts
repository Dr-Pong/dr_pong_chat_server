import { ChannelType } from 'src/domain/channel/type/type.channel';

export class PatchChannelDto {
  userId: number;
  channelId: string;
  password: string;
  access: ChannelType;

  constructor(
    userId: number,
    channelId: string,
    password: string,
    access: ChannelType,
  ) {
    this.userId = userId;
    this.channelId = channelId;
    this.access = access;
    this.password = password;
  }
}
