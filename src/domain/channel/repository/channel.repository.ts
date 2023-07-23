import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from '../entity/channel.entity';
import { Like, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Page } from 'src/global/utils/page';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
} from 'src/domain/channel/type/type.channel';
import { SaveChannelDto } from '../dto/post/save.channel.dto';
import { UpdateChannelDto } from '../dto/patch/update.channel.dto';
import { FindChannelPageDto } from '../dto/get/find.channel.page.dto';
import { UpdateChannelHeadCountDto } from '../dto/patch/update.channel.headcount.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelRepository {
  constructor(
    @InjectRepository(Channel)
    private readonly repository: Repository<Channel>,
  ) {}

  async findAll(): Promise<Channel[]> {
    return await this.repository.find({ where: { isDeleted: false } });
  }

  async findById(channelId: string): Promise<Channel> {
    return await this.repository.findOne({ where: { id: channelId } });
  }

  async findByChannelName(name: string): Promise<Channel> {
    return await this.repository.findOne({
      where: {
        name: name,
        isDeleted: false,
      },
    });
  }

  async findPageByKeywordOrderByCreateAt(
    findDto: FindChannelPageDto,
  ): Promise<Page<Channel[]>> {
    const keyword: string =
      findDto.keyword === null ? '%' : '%' + findDto.keyword + '%';

    const totalChannels: number = await this.repository.count({
      where: {
        name: Like(keyword),
        type: Not(CHANNEL_PRIVATE),
        isDeleted: false,
      },
    });

    const channels: Channel[] = await this.repository.find({
      where: {
        name: Like(keyword),
        type: Not(CHANNEL_PRIVATE),
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
    page.totalPage = Math.floor(totalChannels / findDto.count) + 1;
    page.currentPage =
      findDto.page > page.totalPage ? page.totalPage : findDto.page;

    return page;
  }

  async findPageByKeywordOrderByHeadCount(
    findDto: FindChannelPageDto,
  ): Promise<Page<Channel[]>> {
    const keyword: string =
      findDto.keyword === null ? '%' : '%' + findDto.keyword + '%';

    const totalChannels: number = await this.repository.count({
      where: {
        name: Like(keyword),
        type: Not(CHANNEL_PRIVATE),
        isDeleted: false,
      },
    });

    const channels: Channel[] = await this.repository.find({
      where: {
        name: Like(keyword),
        type: Not(CHANNEL_PRIVATE),
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
    page.totalPage = Math.floor(totalChannels / findDto.count) + 1;
    page.currentPage =
      findDto.page > page.totalPage ? page.totalPage : findDto.page;

    return page;
  }

  async save(saveDto: SaveChannelDto): Promise<Channel> {
    return await this.repository.save({
      operator: { id: saveDto.userId },
      name: saveDto.name,
      isDeleted: false,
      type: saveDto.access,
      password:
        saveDto.access === CHANNEL_PROTECTED
          ? await bcrypt.hash(saveDto.password, Number(process.env.SALT_STRING))
          : null,
      headCount: 1,
      maxHeadCount: saveDto.maxCount,
    });
  }

  async updateHeadCount(updateDto: UpdateChannelHeadCountDto): Promise<void> {
    await this.repository.update(
      {
        id: updateDto.channelId,
      },
      {
        headCount: () => `headcount + ${updateDto.headCount}`,
      },
    );
  }

  async deleteById(channelId: string): Promise<void> {
    await this.repository.update(
      {
        id: channelId,
      },
      {
        isDeleted: true,
      },
    );
  }

  async updateAccessAndPassword(updateDto: UpdateChannelDto): Promise<void> {
    await this.repository.update(
      {
        id: updateDto.channelId,
      },
      {
        type: updateDto.type,
        password: updateDto.password,
      },
    );
  }
}
