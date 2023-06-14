import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMessage } from '../entity/channel-message.entity';
import { In, LessThan, Not, Repository } from 'typeorm';
import { SaveChannelMessageDto } from '../dto/post/save.channel-message.dto';
import { FindChannelMessagePageDto } from '../dto/get/find.channel-message.page.dto';

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

  async findAllByChannelId(
    findDto: FindChannelMessagePageDto,
  ): Promise<ChannelMessage[]> {
    return this.repository.find({
      where: {
        id: LessThan(findDto.offset),
        channel: { id: findDto.channelId },
        user: { id: Not(In(findDto.blockedList)) },
      },
      order: { time: 'DESC' },
      take: findDto.count,
    });
  }
}
