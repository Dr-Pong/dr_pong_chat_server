import { Injectable } from '@nestjs/common';
import { DirectMessage } from './direct-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

@Injectable()
export class DirectMessageRepository {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly repository: Repository<DirectMessage>,
  ) {}

  async findAllDirectMessageByUserIdAndFriendId(
    userId: number,
    friendId: number,
    offset: number,
    count: number,
  ): Promise<DirectMessage[]> {
    const directMessages: DirectMessage[] = await this.repository.find({
      where: {
        roomId: FriendChatManager.generateRoomId(
          userId.toString(),
          friendId.toString(),
        ),
      },
      skip: offset,
      take: count,
    });
    return directMessages;
  }
}
