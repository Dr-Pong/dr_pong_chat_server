import { ChannelType } from 'src/global/type/type.channel';

export class PostChannelDto {
  userId: number;
  name: string;
  access: ChannelType;
  password: string;
  maxCount: number;
}
