import {
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
  ChannelType,
} from 'src/domain/channel/type/type.channel';
import { PostChannelDto } from './post.channel.dto';

export class SaveChannelDto {
  userId: number;
  name: string;
  access: ChannelType;
  password: string;
  maxCount: number;

  static from(dto: PostChannelDto): SaveChannelDto {
    const { userId, title: name, maxCount } = dto;
    let type: ChannelType = dto.access;
    if (type === CHANNEL_PUBLIC && dto.password) type = CHANNEL_PROTECTED;
    let password: string = null;
    if (type === CHANNEL_PROTECTED) password = dto.password;

    const saveChannelDto: SaveChannelDto = new SaveChannelDto(
      userId,
      name,
      type,
      password,
      maxCount,
    );
    return saveChannelDto;
  }

  constructor(
    userId: number,
    name: string,
    access: ChannelType,
    password: string,
    maxCount: number,
  ) {
    this.userId = userId;
    this.name = name;
    this.access = access;
    this.password = password;
    this.maxCount = maxCount;
  }
}
