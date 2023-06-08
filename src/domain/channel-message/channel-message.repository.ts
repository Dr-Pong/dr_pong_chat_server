import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMessage } from './channel-message.entity';
import { Repository } from 'typeorm';
import { SaveChannelMessageDto } from './dto/save.channel-message.dto';
import { FindChannelMessagePageDto } from '../channel-user/dto/find.channel-message.page.dto';

@Injectable()
export class ChannelMessageRepository {
  constructor(
    @InjectRepository(ChannelMessage)
    private readonly repository: Repository<ChannelMessage>,
  ) {}

  async save(saveDto: SaveChannelMessageDto): Promise<ChannelMessage> {
    return this.repository.save({
      user: { id: saveDto.userId },
      channel: { id: saveDto.channelId },
      type: saveDto.type,
      content: saveDto.content,
      time: saveDto.time,
    });
  }

  async findPageByChannelId(
    findDto: FindChannelMessagePageDto,
  ): Promise<ChannelMessage[]> {
    return this.repository.find({
      where: { channel: { id: findDto.channelId } },
      order: { time: 'DESC' },
      skip: findDto.offset,
      take: findDto.count,
    });
  }
}
