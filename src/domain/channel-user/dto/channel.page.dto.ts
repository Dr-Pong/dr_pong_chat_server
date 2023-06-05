import { Channel } from 'src/domain/channel/channel.entity';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import { ChannelType } from 'src/global/type/type.channel';
import { Page } from 'src/global/utils/page';

export class ChannelPageDto {
  id: string;
  title: string;
  access: ChannelType;
  headCount: number;
  maxCount: number;

  static fromEntity(entity: Channel): ChannelPageDto {
    const dto: ChannelPageDto = new ChannelPageDto();
    dto.id = entity.id;
    dto.title = entity.name;
    dto.access = entity.type;
    dto.headCount = entity.headCount;
    dto.maxCount = entity.maxHeadCount;
    return dto;
  }
}

export class ChannelPageDtos {
  channels: ChannelPageDto[];
  currentPage: number;
  totalPage: number;

  static fromPage(channels: Page<Channel[]>): ChannelPageDtos {
    const dto: ChannelPageDtos = new ChannelPageDtos();
    dto.channels = channels.content.map((channel) =>
      ChannelPageDto.fromEntity(channel),
    );
    dto.currentPage = channels.currentPage;
    dto.totalPage = channels.totalPage;
    return dto;
  }
}
