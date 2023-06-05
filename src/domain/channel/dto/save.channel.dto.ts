import { PostChannelDto } from 'src/domain/channel-user/dto/post.channel.dto';
import {
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
  ChannelType,
} from 'src/global/type/type.channel';

export class SaveChannelDto {
  userId: number;
  name: string;
  access: ChannelType;
  password: string;
  maxCount: number;

  static from(dto: PostChannelDto): SaveChannelDto {
    let type: ChannelType = dto.access;
    if (type === CHANNEL_PUBLIC && dto.password) type = CHANNEL_PROTECTED;
    const saveChannelDto: SaveChannelDto = new SaveChannelDto();
    saveChannelDto.userId = dto.userId;
    saveChannelDto.name = dto.name;
    saveChannelDto.access = type;
    saveChannelDto.password = dto.password;
    saveChannelDto.maxCount = dto.maxCount;
    return saveChannelDto;
  }
}
