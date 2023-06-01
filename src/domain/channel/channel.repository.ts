import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './channel.entity';
import { Like, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Page } from 'src/global/utils/page';
import { FindChannelPageDto } from '../channel-user/dto/find.channel.page.dto';
import { CHANNEL_PROTECTED } from 'src/global/type/type.channel';
import { SaveChannelDto } from './dto/save.channel.dto';

@Injectable()
export class ChannelRepository {
  constructor(
    @InjectRepository(Channel)
    private readonly repository: Repository<Channel>,
  ) {}

  async findByChannelName(name: string): Promise<Channel> {
    return await this.repository.findOne({
      where: {
        name: name,
        isDeleted: false,
      },
    });
  }

  async findChannelByPagesOrderByCreateAt(
    findDto: FindChannelPageDto,
  ): Promise<Page<Channel[]>> {
    const totalChannels: number = await this.repository.count({
      where: {
        name: Like('%' + findDto.keyword + '%'),
        isDeleted: false,
      },
    });

    const channels: Channel[] = await this.repository.find({
      where: {
        name: Like('%' + findDto.keyword + '%'),
        isDeleted: false,
      },
      skip: (findDto.page - 1) * findDto.count,
      take: findDto.count,
      order: {
        createdAt: 'DESC',
      },
    });

    const page: Page<Channel[]> = new Page();
    page.content = channels;
    page.totalPage = totalChannels / findDto.count + 1;
    page.currentPage =
      findDto.page > page.totalPage ? page.totalPage : findDto.page;

    return page;
  }

  async findChannelByPagesOrderByHeadCount(
    findDto: FindChannelPageDto,
  ): Promise<Page<Channel[]>> {
    const totalChannels: number = await this.repository.count({
      where: {
        name: Like('%' + findDto.keyword + '%'),
        isDeleted: false,
      },
    });

    const channels: Channel[] = await this.repository.find({
      where: {
        name: Like('%' + findDto.keyword + '%'),
        isDeleted: false,
      },
      skip: (findDto.page - 1) * findDto.count,
      take: findDto.count,
      order: {
        headCount: 'DESC',
      },
    });

    const page: Page<Channel[]> = new Page();
    page.content = channels;
    page.totalPage = totalChannels / findDto.count + 1;
    page.currentPage =
      findDto.page > page.totalPage ? page.totalPage : findDto.page;

    return page;
  }

  async saveChannel(saveDto: SaveChannelDto): Promise<Channel> {
    return await this.repository.save({
      operator: { id: saveDto.userId },
      name: saveDto.name,
      isDeleted: false,
      access: saveDto.access,
      password: saveDto.access === CHANNEL_PROTECTED ? saveDto.password : null,
      headCount: 0,
      maxCount: saveDto.maxCount,
    });
  }

  async deleteChannel(deleteDto: DeleteChannelDto): Promise<void> {
    await this.repository.update(
      {
        id: deleteDto.channelId,
      },
      {
        isDeleted: true,
      },
    );
  }
}