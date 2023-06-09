import { ChannelType } from 'src/domain/channel/type/type.channel';

export class PostChannelDto {
  userId: number;
  title: string;
  access: ChannelType;
  password: string;
  maxCount: number;
}
