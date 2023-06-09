import { Channel } from 'src/domain/channel/entity/channel.entity';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import { ChannelType } from 'src/domain/channel/type/type.channel';
import { Page } from 'src/global/utils/page';

export class ChannelPageDto {
  id: string;
  title: string;
  access: ChannelType;
  headCount: number;
  maxCount: number;

  static fromEntity(entity: Channel): ChannelPageDto {
    const {
      id,
      name: title,
      type: access,
      headCount,
      maxHeadCount: maxCount,
    } = entity;
    return new ChannelPageDto(id, title, access, headCount, maxCount);
  }

  constructor(
    id: string,
    title: string,
    access: ChannelType,
    headCount: number,
    maxCount: number,
  ) {
    this.id = id;
    this.title = title;
    this.access = access;
    this.headCount = headCount;
    this.maxCount = maxCount;
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
